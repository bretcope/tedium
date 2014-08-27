"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var coback = require('coback');
var Tedious = require('tedious');
var TdmBulkLoad = require('./TdmBulkLoad');

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
		let p;
		for (let i in params)
		{
			p = params[i];
			req.addParameter(i, p.type, p.value, p);
		}
	}
	
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
		let rows = sqlResult[1];
		
		result.rowCount = rowCount;
		
		if (!rows || (rows.length === 0 && rowCount !== 0))
			return rowCount;
		
		// convert rows into a better format
		let tdmRows = new Array(rows.length);
		if (rows.length > 0)
		{
			let columns = new Array(rows[0].length);
			for (let i = 0; i < rows[0].length; i++)
			{
				columns[i] = rows[0][i].metadata.colName;
			}

			let r;
			for (let i = 0; i < rows.length; i++)
			{
				r = {};
				for (let ci = 0; ci < columns.length; ci++)
					r[columns[ci]] = rows[i][ci].value;
				
				tdmRows[i] = r;
			}
		}
		
		result.rows = tdmRows;
	}
	else
	{
		result.rowCount = sqlResult; // not sure if this can actually happen
	}

	return result;
};
