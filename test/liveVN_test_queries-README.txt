Following are descriptions of the three test query CSV files (liveVN_test_queries*.csv).

liveVN_test_queries.csv:  This is the "master" file containing all test queries.  It was derived from the API testing spreadsheet that exists as a Google doc.

liveVN_test_queries-all_countable.csv:  The queries in this file all return result sets with a total size of 30,000 records or fewer.  Thus, it is practical to count all of the returned records for all of these queries (to test count errors, e.g.).

liveVN_test_queries-mixed.csv:  This is a mix of queries that is designed to test realistic usage scenarios.  It contains approximately 40% queries with very large result sets where only the first data returned should be examined, 20% small queries with < 100 records where the entire result set can be retrieved, and 40% medium-sized queries that are > 100 records and < 15,000 records where the entire result set can also be retrieved.

liveVN_test_queries-big_resultsets.csv:  This is a set of test queries that all produce result sets in excess of 10,000 records.

