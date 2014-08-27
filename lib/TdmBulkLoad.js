"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var coback = require('coback');

/* =============================================================================
 * 
 * TdmBulkLoad
 *  
 * ========================================================================== */

module.exports = TdmBulkLoad;

/**
 * @param connection {TdmConnection}
 * @param table {string}
 * @constructor
 */
function TdmBulkLoad (connection, table)
{
	/** @private */
	Object.defineProperty(this, '__callback', { value: coback() });
	
	/** @member {TdmConnection} */
	this.connection = connection;
	this.tediousBulkLoad = connection.tediousConnection.newBulkLoad(table, this.__callback);
}

/* -------------------------------------------------------------------
 * Prototype Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * 
 * @param name {string}
 * @param type {Tedium TYPE}
 * @param nullable {boolean} Indicated whether the column accepts null values.
 * @param [objName] {string} The name of the property on row objects (if different from column name).
 */
TdmBulkLoad.prototype.addColumn = function (name, type, nullable, objName)
{
	var o = {
		length: type.length,
		precision: type.precision,
		scale: type.scale,
		objName: objName,
		nullable: nullable
	};
	this.tediousBulkLoad.addColumn(name, type.type, o);
};

TdmBulkLoad.prototype.addRow = function (row)
{
	this.tediousBulkLoad.addRow.apply(this.tediousBulkLoad, arguments);
};

/**
 * @param rows {Array}
 */
TdmBulkLoad.prototype.addRows = function (rows)
{
	for (var i = 0; i < rows.length; i++)
		this.tediousBulkLoad.addRow(rows[i]);	
};

TdmBulkLoad.prototype.execute = function * (options)
{
	if (!options)
		options = {};
	
	if (options.createTable)
	{
		var sql = this.tediousBulkLoad.getTableCreationSql();
		yield this.connection.request(sql, null, { batch: true });
	}
	
	this.connection.tediousConnection.execBulkLoad(this.tediousBulkLoad);
	var result = yield this.__callback.result;
	return result[0]; // row count
};

TdmBulkLoad.prototype.getMergeSql = function (targetTable, matchColumns, options)
{
	var update = options.update || false;
	var insert = options.insert || false;
	var tgt = 'tgt';
	var tmp = 'tmp';
	
	if (!(matchColumns instanceof Array))
		matchColumns = [ matchColumns ];
	
	var sql = 'MERGE ' + targetTable + ' ' + tgt + ' USING ' + this.tediousBulkLoad.table + ' ' + tmp +
		'\nON (' + matchColumns.map(function (c) { return tgt + '.' + c + '=' + tmp + '.' + c;  }).join(' AND ') + ')';
	
	var i;
	var cols = this.tediousBulkLoad.columns;
	var columnNames = [];
	for (i = 0; i < cols.length; i++)
		columnNames.push(cols[i].name);
	
	if (insert)
	{
		sql += '\nWHEN NOT MATCHED BY TARGET THEN INSERT ' +
			'\n(' + columnNames.join(',') + ')' +
			'\nVALUES (' + columnNames.map(function (c) { return tmp + '.' + c; }).join(',') + ')';
	}
	
	if (update)
	{
		sql += '\nWHEN MATCHED THEN UPDATE SET\n';
		
		var comma = false;
		for (i = 0; i < columnNames.length; i++)
		{
			if (matchColumns.indexOf(columnNames[i]) !== -1)
				continue;
			
			if (comma)
				sql += ',';
			else
				comma = true;
			
			sql += tgt + '.' + columnNames[i] + '=' + tmp + '.' + columnNames[i];
		}
	}
	
	return sql + ';';
};
