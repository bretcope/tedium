"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var coback = require('coback');
var Tedious = require('tedious');
var TdmBulkLoad = require('./TdmBulkLoad');
var TdmTransaction = require('./TdmTransaction');

/* =============================================================================
 * 
 * TdmConnection
 *  
 * ========================================================================== */

module.exports = TdmConnection;

function TdmConnection (id, tediousConn)
{
	this.id = id;
	/** @member {TdmConnectionPool} */
	this.pool = null;
	this.tediousConnection = tediousConn;
	this.lastActivity = Date.now();
}

/* -------------------------------------------------------------------
 * Prototype Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

TdmConnection.prototype.bulkLoad = function (table)
{
	return new TdmBulkLoad(this, table);
};

TdmConnection.prototype.request = function * (sql, params, options)
{
	this.lastActivity = Date.now();
	if (!options)
		options = {};
	
	var cb = coback();
	var req = new Tedious.Request(sql, cb);
	
	if (params)
	{
		for (let i in params)
		{
			let p = params[i];
			req.addParameter(i, p.type, p.value, p);
		}
	}
	
	var colNames = [];
	var recordsets = [];
	var recordset = [];
	
	req.on('columnMetadata', function (metadata)
	{
		colNames = columnNamesFromMetadata(metadata);
	});
	
	function done(rowCount, more)
	{
		if (colNames.length === 0) return;
		
		recordsets.push(recordset);
		recordset = [];
		colNames = [];
	}
	
	req.on('done', done);
	req.on('doneInProc', done);
	
	req.on('row', function (columns)
	{
		var row = {};
		for (var i = 0, l = columns.length; i < l; ++i)
			row[colNames[i]] = columns[i].value;
		recordset.push(row);
	});
	
	if (options.batch)
		this.tediousConnection.execSqlBatch(req);
	else
		this.tediousConnection.execSql(req);
	
	var sqlResult = yield cb.result;
	
	var result = {
		rowCount: null,
		rows: null
	};
	
	this.lastActivity = Date.now();
	if (sqlResult instanceof Array)
	{
		let rowCount = sqlResult[0];
		if (!recordsets || (recordsets.length === 0 && rowCount !== 0))
			return rowCount;
		
		result.rowCount = rowCount;
		
		result.rows = options.multiple
			? recordsets
			: recordsets[0];
	}
	
	return result;
};

TdmConnection.prototype.usingTransaction = function * (isolationLevel, name, scope)
{
	if (typeof scope !== 'function')
	{
		if (typeof name === 'function')
		{
			scope = name;
			name = undefined;
		}
		else
		{
			scope = isolationLevel;
			name = undefined;
			isolationLevel = undefined;
		}
	}
	
	/** @type {TdmTransaction} */
	let tran = yield TdmTransaction.createTransaction(this, isolationLevel, name);
	let error = null;
	
	try
	{
		yield scope(tran);
	}
	catch (ex)
	{
		error = ex;
	}
	
	if (tran.open)
		yield tran.rollback();
	
	if (error)
		throw error;
};

function columnNamesFromMetadata (metadata)
{
	var names = new Array(metadata.length);
	for (var i = 0, l = metadata.length; i < l; ++i)
		names[i] = metadata[i].colName;
	return names;
}
