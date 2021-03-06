# Tedium

[Tedious](https://github.com/pekim/tedious) is a great JavaScript implementation of the TDS protocol for interacting with Microsoft SQL Server, but its API is not particularly application friendly. Tedium gives you a very clean interface which helps you write code both quicker and safer.

* [Usage](#usage)
    * [Install](#install)
    * [Connection Pool Setup](#connection-pool-setup)
    * [Making Requests](#making-requests)
    * [Transactions](#transactions)
* [Data Types](#data-types)
* [Bulk Load](#bulk-load)

> Tedium is built using generators, and therefore requires `node >= 0.11.x`. If you need a Tedious wrapper using the traditional callback style, try [node-mssql](https://github.com/patriksimek/node-mssql). It's also a great library and there is a co-ified version of it as well.

__Tedium is a work in progress. Expect there to be some problems and missing features. Notable missing features:__

* Output variables
* Good disconnect options

## Usage

### Install

    npm install tedium

### Connection Pool Setup

First create a connection pool. The `tediousOptions` are exactly the same as the options accepted by the [Tedious Connection](http://pekim.github.io/tedious/api-connection.html) constructor.

```js
var tedium = require('tedium');

var tediousOptions = {
  userName: 'user',
  password: 'pass',
  server: 'localhost',
  options: {
    database: 'DatabaseName'
  }
};

// passing pool options is optional, it defaults to this:
var poolOptions = {
  min: 0,        // minimum connections to hold alive
  max: 20,       // maximum number of connections which can be opened
  timeout: 30000 // minimum amount of time a connection must sit idle before closing
};

var pool = yield tedium.createConnectionPool(tediousOptions, poolOptions);
```

### Making Requests

The best way to acquire a connection is to use the `.using()` method. Inspired by C#'s using-block syntax, the connection will be automatically released back to the pool when the "scope" function completes. If an exception is thrown inside the scope, the connection is closed instead of returning it to the pool and the exception is re-thrown.

```js
// you should typically call yield on the .using call so that any code which follows
// runs after the code inside the scope function. 
yield pool.using(function * (db) {
  // select where id = 52
  var params = { id: tedium.int(52) };
  var result = yield db.request('select * from MyTable where id = @id', params);
  console.log('row count: ' + result.rowCount);
  console.log(result.rows);
});
```

If you only need the connection open for one request, you can use the `pool#request` shortcut method.

```js
var results = yield pool.request(sql, params);
```

If you want requests to be executed as part of a SQL Batch, you can specify `batch: true` in the third argument to `request()`. Generally you don't want to set this, but there are some instances when it is necessary, such as for running multiple requests on a temporary table or inside a manually managed transaction.

```js
var results = yield pool.request(sql, params, { batch: true });
```

If you need to return multiple result sets from your SQL Query, you can specify `multiple: true` in the third argument to `request()`. In this case, the `rows` property of the returned results will be an array of arrays of rows, rather than just a single array of rows.

```js
var results = yield pool.request(sql, params, { multiple: true });

var firstSet = results.rows[0];
var secondSet = results.rows[1];
// etc...
```

### Transactions

Transactions can be acquired in a similar way as a connection.

```js
yield pool.usingTransaction(function * (t) {
  yield t.request(sql, params);
  yield.commit();
});
```

If `.commit()` or `.rollback()` are not called (and yielded on), or an error is thrown, then the transaction will be rolled back automatically.

`usingTransaction([isolationLevel,] [name,] scope)` is a function on both Connection and ConnectionPool objects.
 
* `isolationLevel` (optional) Defaults to `tediousOptions.options.isolationLevel`, or `READ_COMMITTED` if not provided. One of:
    * `Tedium.READ_UNCOMMITTED`
    * `Tedium.READ_COMMITTED`
    * `Tedium.REPEATABLE_READ`
    * `Tedium.SERIALIZABLE`
    * `Tedium.SNAPSHOT`
* `name` (optional) The name of the transaction.
* `scope` A generator function which will be passed the transaction object.

## Data Types

Tedium supports all of the data types that [Tedious](http://pekim.github.io/tedious/api-datatypes.html) does. Each type is a top level method on the `tedium` object. The last argument is the value of the parameter. Some types accept a length, scale, and/or precision arguments as well.

For example, nVarChar accepts a length argument first. Such as 

```js
tedium.nVarChar(50, 'this string can be up to 50 chars')
tedium.nVarChar('max', 'this could be long...')
```

__Type Signatures:__

```js
tedium.bit (value)
tedium.tinyInt (value)
tedium.smallInt (value)
tedium.int (value)
tedium.bigInt (value)
tedium.numeric (precision, scale, value)
tedium.decimal (precision, scale, value)
tedium.smallMoney (value)
tedium.money (value)

// approximate numerics
tedium.float (value)
tedium.real (value)

// date and time
tedium.smallDateTime (value)
tedium.dateTime (value)
tedium.dateTime2 (scale, value)
tedium.dateTimeOffset (scale, value)
tedium.time (scale, value)

// character strings
tedium.char (length, value)
tedium.varChar (length, value)
tedium.text (value)

// unicode strings
tedium.nChar (length, value)
tedium.nVarChar (length, value)
tedium.nText (value)

// binary strings
tedium.binary (length, value)
tedium.varBinary (length, value)
tedium.image (value)

// other data types
tedium.null (value)
tedium.tvp (value)
tedium.udt (value)
tedium.uniqueIdentifier (value)
tedium.xml (value)
```

## Bulk Load

Tedium supports SQL Server Bulk Insert.

```js
yield pool.using(function * (db)
{
  // pass bulkLoad the name of the table you want to insert into
  // in this case, we're going to use a temporary table (starts with a #)
  var bulk = db.bulkLoad('#tmpTable');
  
  // add all the columns you need before adding rows
  // addColumn requires three arguments, and accepts an optional fourth
  /*
  colName - name of the column in SQL Server
  type - a tedium type (no need to provide a value in this case)
  nullable - true/false whether the column is nullable in SQL Server
  objName - allows you to specify the property name (where to look for 
            this column on row objects). It defaults to colName.
  */
  bulk.addColumn('intCol', Tedium.int(), false, 'iii');
  bulk.addColumn('strCol', Tedium.nVarChar(50), true, 'sss');
  
  // The addRow method accepts a number of overloads
  bulk.addRow({ iii: 201, sss: "one zero one" });
  bulk.addRow([ 202, "one zero two" ]);
  bulk.addRow(203, "one zero three");
  
  // when you're done adding rows, execute the bulk insert.
  // The options argument is optional. In this case we're setting
  // createTable to true so that the temporary table is created
  // automatically for us
  var rowCount = yield bulk.execute({ createTable: true });
  console.log(rowCount); // 3
  
  // Once we're done with the bulk insert, we can still perform other
  // actions with the connection. For example, this would be the place
  // to send a merge request to merge our temporary table into a 
  // permanent table.
});
```

Because a common use for bulk load is to insert into a temporary table and then merge into a permanent table, a helper function is provided to generate the merge SQL statement.

```js
var sql = bulk.getMergeSql('PermanentTable', [ 'id' ], { insert: true, update: true });
yield db.request(sql, null, { batch: true });
```

Arguments:

* `targetTable` - the name of the table to merge into.
* `matchColumns` - the names of the columns to match on which to join the tables. A single string, or an array of strings are permitted.
* `options`
    * `insert` - true to generate a `WHEN NOT MATCHED BY TARGET THEN INSERT...` clause.
    * `update` - true to generate a `WHEN MATCHED THEN UPDATE...` clause.

It's possible that more options will be added in the future. Right now this method only generates simple merge syntax for the most common use cases.

> The merge request must be performed on the same db connection as the bulk insert, and with the `batch: true` option set.
