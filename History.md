# Tedium Changelog

Tedium is being versioned using [FerVer](https://github.com/jonathanong/ferver) semantics. Short version is:

* __Major:__ major breaking changes.
* __Minor:__ minor pedantic breaking changes (bug fixes often fall into this category).
* __Patch:__ all non-breaking changes (most feature additions).

---

## 1.x.x

### 1.0.x

* 1.0.6
    * Added `TdmTransaction#bulkLoad()` shortcut method.
* 1.0.5
    * Added Transaction support.
* 1.0.4
    * Added `TdmBulkLoad#getMergeSql()`.
* 1.0.3
    * _No code changes._
* 1.0.2
    * Expose Tedious isolation levels.
* 1.0.1
    * Added `Tedium.parseConnectionString()`.
* 1.0.0
    * Initial library version.