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
 * Private Members Declaration << no methods >>
 * ---------------------------------------------------------------- */

// code

/* -------------------------------------------------------------------
 * Public Members Declaration << no methods >>
 * ---------------------------------------------------------------- */

// code

/* -------------------------------------------------------------------
 * Public Methods << Keep in alphabetical order >>
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
