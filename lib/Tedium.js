"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var Tedious = require('tedious');
var TdbBulkLoad = require('./TdmBulkLoad');
var TdmConnection = require('./TdmConnection');
var TdmConnectionPool = require('./TdmConnectionPool');

/* =============================================================================
 * 
 * Tedium
 *  
 * ========================================================================== */

var Tedium = module.exports;

/* -------------------------------------------------------------------
 * Namespace
 * ---------------------------------------------------------------- */

Tedium.BulkLoad = TdbBulkLoad;
Tedium.Connection = TdmConnection;
Tedium.ConnectionPool = TdmConnectionPool;

/* -------------------------------------------------------------------
 * TDS Data Types
 * ---------------------------------------------------------------- */

var TYPES = Tedious.TYPES;

// exact numerics
Tedium.bit = function (value) { return { value: value, type: TYPES.Bit }; };
Tedium.tinyInt = function (value) { return { value: value, type: TYPES.TinyInt }; };
Tedium.smallInt = function (value) { return { value: value, type: TYPES.SmallInt }; };
Tedium.int = function (value) { return { value: value, type: TYPES.Int }; };
Tedium.bigInt = function (value) { return { value: value, type: TYPES.BigInt }; };
Tedium.numeric = function (precision, scale, value) { return { value: value, type: TYPES.Numeric, precision: precision, scale: scale }; };
Tedium.decimal = function (precision, scale, value) { return { value: value, type: TYPES.Decimal, precision: precision, scale: scale }; };
Tedium.smallMoney = function (value) { return { value: value, type: TYPES.SmallMoney }; };
Tedium.money = function (value) { return { value: value, type: TYPES.Money }; };

// approximate numerics
Tedium.float = function (value) { return { value: value, type: TYPES.Float }; };
Tedium.real = function (value) { return { value: value, type: TYPES.Real }; };

// date and time
Tedium.smallDateTime = function (value) { return { value: value, type: TYPES.SmallDateTime }; };
Tedium.dateTime = function (value) { return { value: value, type: TYPES.DateTime }; };
Tedium.dateTime2 = function (scale, value) { return { value: value, type: TYPES.DateTime2, scale: scale }; };
Tedium.dateTimeOffset = function (scale, value) { return { value: value, type: TYPES.DateTimeOffset, scale: scale }; };
Tedium.time = function (scale, value) { return { value: value, type: TYPES.Time, scale: scale }; };

// character strings
Tedium.char = function (length, value) { return { value: value, type: TYPES.Char, length: length }; };
Tedium.varChar = function (length, value) { return { value: value, type: TYPES.VarChar, length: length }; };
Tedium.text = function (value) { return { value: value, type: TYPES.Text }; };

// unicode strings
Tedium.nChar = function (length, value) { return { value: value, type: TYPES.NChar, length: length }; };
Tedium.nVarChar = function (length, value) { return { value: value, type: TYPES.NVarChar, length: length }; };
Tedium.nText = function (value) { return { value: value, type: TYPES.NText }; };

// binary strings
Tedium.binary = function (length, value) { return { value: value, type: TYPES.Binary, length: length }; };
Tedium.varBinary = function (length, value) { return { value: value, type: TYPES.VarBinary, length: length }; };
Tedium.image = function (value) { return { value: value, type: TYPES.Image }; };

// other data types
Tedium.null = function (value) { return { value: value, type: TYPES.Null }; };
Tedium.tvp = function (value) { return { value: value, type: TYPES.TVP }; };
Tedium.udt = function (value) { return { value: value, type: TYPES.UDT }; };
Tedium.uniqueIdentifier = function (value) { return { value: value, type: TYPES.UniqueIdentifier }; };
Tedium.xml = function (value) { return { value: value, type: TYPES.Xml }; };

/* -------------------------------------------------------------------
 * Public Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

Tedium.createConnectionPool = function * (tdsConfig, options)
{
	var pool = new TdmConnectionPool(tdsConfig, options);
	
	// test the settings by acquiring one connection right away
	var c = yield pool.acquire();
	pool.release(c);
	
	return pool;
};
