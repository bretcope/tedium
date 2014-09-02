"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var coback = require('coback');
var Tedious = require('tedious');
var TdmConnection = require('./TdmConnection');

/* =============================================================================
 * 
 * TdmConnectionPool
 *  
 * ========================================================================== */

module.exports = TdmConnectionPool;

function TdmConnectionPool (tediousConfig, options)
{
	/**
	 * @member {Object.<string, TdmConnection>}
	 * @private
	 * */
	Object.defineProperty(this, '__connections', { value: {} });
	/**
	 * @member {TdmConnection[]}
	 * @private
	 */
	Object.defineProperty(this, '__idle', { value: [] });
	/** @private */
	Object.defineProperty(this, '__nextId', { value: 1, writable: true });
	Object.defineProperty(this, '__acquireQueue', { value: [] });
	
	if (!tediousConfig.options)
		tediousConfig.options = {};
	
	this.tediousConfig = tediousConfig;
	this.count = 0;
	this.draining = false;
	
	options = options || {};
	this.min = options.min || 0;
	this.max = options.max || 20;
	this.timeout = options.timeout || 30000;
		
	// this isn't exactly what timeout implies, but it'll work at least for now
	setInterval(this.trim.bind(this), this.timeout);
}

/* -------------------------------------------------------------------
 * Prototype Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

TdmConnectionPool.prototype.acquire = function * ()
{
	if (this.__idle.length > 0)
		return this.__idle.pop();
	
	if (this.count < this.max)
	{
		// create a new connection
		var tdsConn = new Tedious.Connection(this.tediousConfig);
		yield tdsConn.on.bind(tdsConn, 'connect');

		var c = new TdmConnection(this.__nextId++, tdsConn);
		this.__connections[c.id] = c;
		this.count++;
		return c;
	}
	
	// wait for the next available connection
	var cb = coback();
	this.__acquireQueue.push(cb);
	return yield cb.result;
};

TdmConnectionPool.prototype.autoDrain = function ()
{
	this.draining = true;
	this.trim();
};

/**
 * @param c {TdmConnection}
 * @param [idleIndex] {number}
 */
TdmConnectionPool.prototype.close = function (c, idleIndex)
{
	c.tediousConnection.close();
	
	if (idleIndex !== undefined)
		this.__idle.splice(idleIndex, 1);

	if (this.__connections[c.id] === c)
		this.__connections[c.id] = null;
		this.count--;
};

/**
 * @param c {TdmConnection}
 */
TdmConnectionPool.prototype.release = function (c)
{
	if (this.__connections[c.id] !== c || this.__idle.indexOf(c) !== -1)
		return;
	
	if (this.__acquireQueue.length > 0)
	{
		this.__acquireQueue.shift()(null, c);
	}
	else
	{
		this.__idle.push(c);
		if (this.draining)
			this.trim();
	}
};

TdmConnectionPool.prototype.request = function * (sql, params, options)
{
	var result = null;
	yield this.using(function * (db)
	{
		result = yield db.request(sql, params, options);
	});
	
	return result;
};

TdmConnectionPool.prototype.trim = function ()
{
	// check which connections have been idle for at least the timeout period
	var threshold = Date.now() - this.timeout;
	/** @type {TdmConnection} */
	var c;
	for (var i = this.__idle.length - 1; i > -1; i--)
	{
		if (!this.draining && this.count === this.min)
			return;

		c = this.__idle[i];
		if (this.draining || c.lastActivity < threshold)
		{
			this.close(c, i);
		}
	}
};

TdmConnectionPool.prototype.using = function * (scope, ctx)
{
	var c = yield this.acquire();
	try
	{
		var result = yield scope.call(ctx, c);
		this.release(c);
		return result;
	}
	catch (ex)
	{
		// who knows what the connection state is, safest to just close it
		this.close(c);
		throw ex;
	}
};

TdmConnectionPool.prototype.usingTransaction = function * (isolationLevel, name, scope, ctx)
{
	return yield this.using(/**@param db {TdmConnection}*/function * (db)
	{
		return yield db.usingTransaction(isolationLevel, name, scope, ctx);
	});
};
