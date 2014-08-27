"use strict";
/* -------------------------------------------------------------------
 * Require Statements << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

var coback = require('coback');

/* =============================================================================
 * 
 * TdmTransaction
 *  
 * ========================================================================== */

var _state = Symbol('state');

var States = {
	OPEN: 1,
	ROLLING_BACK: 2,
	COMMITTING: 3,
	ROLLED_BACK: 4,
	COMMITTED: 5
};

/* -------------------------------------------------------------------
 * Constructor
 * ---------------------------------------------------------------- */

module.exports = TdmTransaction;

/**
 * @param conn {TdmConnection}
 * @constructor
 */
function TdmTransaction (conn)
{
	this[_state] = States.OPEN;
	
	/** @member {TdmConnection} */
	this.connection = conn;
	this.error = null;
}

/* -------------------------------------------------------------------
 * Getters / Setters
 * ---------------------------------------------------------------- */

Object.defineProperty(TdmTransaction.prototype, 'open', {
	get: function () { return this[_state] === States.OPEN; }
});

/* -------------------------------------------------------------------
 * Static Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

/**
 * @param conn {TdmConnection}
 * @param [isolationLevel] {number}
 * @param [name] {string}
 * @return {TdmTransaction}
 */
TdmTransaction.createTransaction = function * (conn, isolationLevel, name)
{
	var cb = coback();
	conn.tediousConnection.beginTransaction(cb, name, isolationLevel);
	yield cb.result;
	
	return new TdmTransaction(conn);
};

/* -------------------------------------------------------------------
 * Prototype Methods << Keep in alphabetical order >>
 * ---------------------------------------------------------------- */

TdmTransaction.prototype.commit = function * ()
{
	if (!this.open)
	{
		throw new Error('Cannot commit. Transaction is closed or errored.');
	}
	
	try
	{
		this[_state] = States.COMMITTING;
		yield this.connection.tediousConnection.commitTransaction.bind(this.connection.tediousConnection);
		this[_state] = States.COMMITTED;
	}
	catch (ex)
	{
		this.error = ex;
		throw ex;
	}
	
};

TdmTransaction.prototype.request = function (sql, params, options)
{
	return this.connection.request.apply(this.connection, arguments);
};

TdmTransaction.prototype.rollback = function * ()
{
	if (!this.open && this[_state] !== States.COMMITTING) // if the commit failed, try to rollback. It may also fail, but oh well.
		throw new Error('Cannot rollback. Transaction is closed or errored.');
	
	try
	{
		this[_state] = States.ROLLING_BACK;
		yield this.connection.tediousConnection.rollbackTransaction.bind(this.connection.tediousConnection);
		this[_state] = States.ROLLED_BACK;
	}
	catch (ex)
	{
		this.error = ex;
		throw ex;
	}
};
