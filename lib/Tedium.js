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
 * TDS Isolation Levels
 * ---------------------------------------------------------------- */

Tedium.READ_UNCOMMITTED = Tedious.ISOLATION_LEVEL.READ_UNCOMMITTED;
Tedium.READ_COMMITTED = Tedious.ISOLATION_LEVEL.READ_COMMITTED;
Tedium.REPEATABLE_READ = Tedious.ISOLATION_LEVEL.REPEATABLE_READ;
Tedium.SERIALIZABLE = Tedious.ISOLATION_LEVEL.SERIALIZABLE;
Tedium.SNAPSHOT = Tedious.ISOLATION_LEVEL.SNAPSHOT;

/* -------------------------------------------------------------------
 * Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

Tedium.createConnectionPool = function * (tdsConfig, options)
{
	var pool = new TdmConnectionPool(tdsConfig, options);
	
	// test the settings by acquiring one connection right away
	var c = yield pool.acquire();
	pool.release(c);
	
	return pool;
};

Tedium.parseConnectionString = function (connString)
{
	var config = {
		userName: null,
		password: null,
		server: 'localhost',
		options: {}
	};
	
	var match, token, value;
	var reg = /([^;=]+)=([^;]+)(?:;|$)/g;
	while (match = reg.exec(connString))
	{
		token = match[1].trim().toLowerCase();
		value = match[2].trim();

		switch (token)
		{
			case 'driver':
				break;
			case 'server':
				config.server = value;
				break;
			case 'port':
				config.options.port = value;
				break;
			case 'database':
				config.options.database = value;
				break;
			case 'uid':
				config.userName = value;
				break;
			case 'pwd':
				config.password = value;
				break;
			case 'tds_version':
				config.options.tdsVersion = value.replace(/\./g, '_');
				break;
			case 'applicationintent':
				switch (value.toLowerCase())
				{
					case 'readwrite': config.options.readOnlyIntent = false; break;
					case 'readonly': config.options.readOnlyIntent = true; break;
					default: throw new Error('Unknown value for ApplicationIntent: ' + value);
				}
				break;
			case 'multisubnetfailover':
				switch (value.toLowerCase())
				{
					case 'true': config.options.multiSubnetFailover = true; break;
					case 'false': config.options.multiSubnetFailover = false; break;
					default: throw new Error('MultiSubnetFailover must be "True" or "False". Found "' + value + '"');
				}
			default:
				throw new Error('Unknown connection string token: ' + token);
		}
	}

	return config;
};
