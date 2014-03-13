@gist https://gist.github.com/tronhammer/df651e353be29f2ff221

# Performance Audit Suite
This suite is designed to audit the many facets and realms of the Ontraport landscape. Once enough metrics have 
been derived from a subsequent number of audits, custom reports can be generated and queried against with selective
verbosity and rendered into graphs and tables.

## Architecture
There are two primary actors in the performance audit landscape.

### Controllers

#### The Performance Audit Manager [`PerformanceAuditManager`]
The Performance Audit Manager acts as the primary interface for auditing. It is responsible for initializing, 
starting, stopping, saving and retreiving reports from all enabled Auditors. It also has a fairly comprehensive 
logging and debugging system integrated in order to encapsulate itself as much as possible from the Ontraport 
codebase (this matters as certain functions can be cherry picked and/or ignored during some audits).

Ideally, all Auditors are solely interacted with through The Manager. But the architecture was initially designed 
to be extendable while still attempting to be decoupled (not always possible without bloat and performance degredation)
and maintain security.

#### Auditors [`PerformanceAuditor`]
Auditors act as the interfaces between the Performance Audit Manager and profiling resources. They are responsible 
for performing the basic requirements of an audit, which are:

 * Ensuring that their auditing resource and its dependencies are available, initialized and configured correctly.
 * Starting and stopping their respective auditing resource.
 * Identifying themselves and their metrics in normalized comprehensive reports.
 * Passing reports along to the Performance Audit Manager to be saved to a centralized database.

New Auditors are highly encouraged, but not required, to extend the `PerformanceAudit` abstract class to gain common 
functionality, as well as implement the `iPerformanceAudit` interface so as to ensure integrity is enforced.

### Models

#### Performance Metrics [`PerformanceMetric`]
A Performance Metric is a Model for reports generated by Auditors that need to be normalized and saved to the database.

## Auditing
Auditing begins when a new `PerformanceAuditManager` instance is initialized and its `init()` or `start()` function is 
called. After which each Auditor is initialized and complete their individual dependency checks. Auditing continues until
`stop()` is called. 

The general rule of thumb is to attempt to complete as much setup and configuration in the initialization period as 
possible so Auditors don't cannibalize their own profiling.

### Realms
Auditors' Performance Metrics are partly identified by the realms they are auditing. This allows reports to be more granular 
during filtering. 

##### Back End [`performance_audit`.`metrics`.`realm[backend]`]
These are Performance Metrics that are derived to profile the code executing on the server. 
This includes data such as:

 * CPU
 * Memory usage
 * Time spent processing

##### Front End [`performance_audit`.`metrics`.`realm[frontend]`]
These are Performance Metrics that are derived to profile the code executing on the clients browser.
This includes data such as:

 * Page load time
 * Performance optimization and compression recommendations
 * Bandwidth
 * Browser cache state

##### Others...
And a few others that haven't been fully fleshed out yet.

 * Network [`performance_audit`.`metrics`.`realm[network]`]
 * System [`performance_audit`.`metrics`.`realm[system]`]
 * Remote [`performance_audit`.`metrics`.`realm[remote]`]

### Sources
Auditors' Performance Metrics are also identified by the source from which the data was derived. These are also known
as the Auditor's "resource," which is an initialized representation of a "source".

Some of the currently existing sources are:

 * Facebook's XHProf PHP extension [`performance_audit`.`metrics`.`source[xhprof]`]
 * PHP's XDebug PHP extension [`performance_audit`.`metrics`.`source[xdebug]`]
 * Yahoo's Boomerang.js Plugin [`performance_audit`.`metrics`.`source[boomerang]`]
 * Yahoo's YSlow Browser Extension [`performance_audit`.`metrics`.`source[yslow]`]
 * Google's PageSpeed Browser Extension [`performance_audit`.`metrics`.`source[pagespeed]`]
 
######* Currently the `performance_audit`.`metrics` tables `source` and `realm` columns are type `enum` for sql look up optimization, but might change to be just `varchar` in the future to allow for expansion.

### Conditional Audits
Auditing only happens by chance to allow for randomized sampling, while also not kicking our clients in the teeth with a slough 
of performance audits. A discrete stochastic variable is created and a probability of it equaling `1` determines if the audit 
proceeds.

Currently the probabilities for specific realms are:

__Back End Audit Probability__: 1/100 chance

__Front End Audit Probability____: 1/25 chance

If auditing does occure, there is an additional throttle on how many audits can happen per account. This allows for a more diverse 
sampling group as well.

__Current Per Account Audit Threshold__: 15

######* Future plans are to create a means for individual Auditors to define what percentage of the total audits they would like to execute during

### Audit Workflow from Entry Point - (_index.php_)
The conditional initialization happens as close to the entry point as possible, which is at the top of `/www/index.php`. If the 
chance conditional passes, or the flag `__oppa` is found in the request headers, then the constant `PERFORMANCE_AUDIT_MODE` flag is 
set and auditing begins.

A new `PerformanceAuditManager` instance is initialized and all subsequent Auditors are initialized. If the `__oppa` flag was set, 
then the respective non Back End Auditor is added to the `PerformanceAuditManager::$endabledResources` list prior to initialization.

Once all Auditors are initialized, normal bootstrapping occures. We unfortunetly can't begin auditing until we have an `AccountHandle` 
to determine if the audits per account threshold has been met. Luckily most of the Back End Auditors are extended directly into PHP 
and can thusly retroactively retrieve stats from load time after the fact.

Auditing ends after everything else in `index.php` has been run and the `PerformanceAuditManager` has been stopped.

## Reporting
Reporting is the next beast to conquer. The idea is that the `PerformanceAuditManager` should be able to accept a set of params that 
get distributed to pertinent Auditors which in return generate composite reports.

### Metrics
More once established.

## Setup
Prior to the Performance Audit Suite being included in the code base, some dependencies must be installed. 

This currently includes:

 * `performance_audit` database and tables
 * `xhprof` PHP extension
 
Setup is done through a bash script and a php script which loads in the database config data attempts to connect to the mysql database 
to see if it exists yet.

### Setup Files

__Server Setup Script__: `/PerformanceAudit/bin/server_update.sh`

__PHP Database Query Script__: `/PerformanceAudit/bin/check_database.php`

__Database SQL__: `/PerformanceAudit/data/performance_audit.database.sql`

__xhprof PHP extension ini file__: `/PerformanceAudit/data/php.extension.ini`


### Running
To begin a server update, simply run the following command and answer the prompts.

```
cd /PerformanceAudit/bin/
sh ./server_update.sh
```

## Future Todos...
