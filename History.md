# Tedium Changelog

Tedium is being versioned using [FerVer](https://github.com/jonathanong/ferver) semantics. Short version is:

* __Major:__ major breaking changes.
* __Minor:__ minor pedantic breaking changes (bug fixes often fall into this category).
* __Patch:__ all non-breaking changes (most feature additions).

---

## 1.x.x

### 1.1.x

* [1.1.4](https://github.com/bretcope/tedium/releases/tag/v1.1.4)
    * Don't rollback transactions twice. [4f702b7](https://github.com/bretcope/tedium/commit/4f702b71a12bc9bf28a2d323deb9f3c24b1deee5)
* [1.1.3](https://github.com/bretcope/tedium/releases/tag/v1.1.3)
    * Reset connections when shifting on to the pending queue. [e0e7e90](https://github.com/bretcope/tedium/commit/e0e7e90b53fc6d32caffb828de0c47913b280ed3)
* [1.1.2](https://github.com/bretcope/tedium/releases/tag/v1.1.2)
    * Reset connections when returning to the connection pool. [6971a7f](https://github.com/bretcope/tedium/commit/6971a7fd5375d8226cf05ecedca2bd8b5f969f46)
* [1.1.1](https://github.com/bretcope/tedium/releases/tag/v1.1.1)
    * Make using methods return the result from the scope function. [b2a2e22](https://github.com/bretcope/tedium/commit/b2a2e2273aa6bc83ab3cd9b9c3395ba5899c6969)
    * Added optional context argument to `using` methods. [#1](https://github.com/bretcope/tedium/pull/1)
* [1.1.0](https://github.com/bretcope/tedium/releases/tag/v1.1.0)
    * Support multiple result sets. [e06b256](https://github.com/bretcope/tedium/commit/e06b25626160077267c79aefe0396b7a690ed783)

### 1.0.x

* [1.0.6](https://github.com/bretcope/tedium/releases/tag/v1.0.6)
    * Added `TdmTransaction#bulkLoad()` shortcut method.
* [1.0.5](https://github.com/bretcope/tedium/releases/tag/v1.0.5)
    * Added Transaction support.
* [1.0.4](https://github.com/bretcope/tedium/releases/tag/v1.0.4)
    * Added `TdmBulkLoad#getMergeSql()`.
* [1.0.3](https://github.com/bretcope/tedium/releases/tag/v1.0.3)
    * _No code changes._
* [1.0.2](https://github.com/bretcope/tedium/releases/tag/v1.0.2)
    * Expose Tedious isolation levels.
* [1.0.1](https://github.com/bretcope/tedium/releases/tag/v1.0.1)
    * Added `Tedium.parseConnectionString()`.
* 1.0.0
    * Initial library version.
