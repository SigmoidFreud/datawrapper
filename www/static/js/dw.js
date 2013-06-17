
var Datawrapper = {}; // backward compat

(function(){

    var root = this,
        dw = {};

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = dw;
        }
        exports.dw = dw;
    } else {
        root.dw = dw;
    }

/*
 * NEW dataset class
 */
dw.dataset = function(columns, opts) {

    // make column names unique
    var columnsByName = {};
    _.each(columns, function(col) {
        var origColName = col.name(),
            colName = origColName,
            appendix = 1;

        while (columnsByName.hasOwnProperty(colName)) {
            colName = origColName+'.'+(appendix++);
        }
        if (colName != origColName) col.name(colName); // rename column
        columnsByName[colName] = col;
    });

    opts = _.extend(opts, {
        firstColumnAsLabel: true
    });

    // public interface
    var dataset = {

        columns: function() {
            return columns;
        },

        column: function(x) {
            if (_.isString(x)) {
                // single series by name
                if (columnsByName[x] !== undefined) return columnsByName[x];
                throw 'No column found with that name: "'+x+'"';
            }
            // single series by index
            if (columns[x] !== undefined) return columns[x];
            throw 'No series found with that index: '+x;
        },

        numColumns: function() {
            return columns.length;
        },

        numRows: function() {
            return columns[0].length;
        },

        // -----------------------------------------
        // everything below this line is kept for
        // backward compatibility only
        // -----------------------------------------

        series: function(x) {
            if (x !== undefined) {
                return dataset.column(x);
            }
            return dataset.columns();
        },

        hasRowNames: function() {
            return opts.firstRowAsLabel;
        },


        eachSeries: function(func) {
            _.each(columns, func);
        },

        eachRow: function(func) {
            var i;
            for (i=0; i<dataset.numRows(); i++) {
                func(i);
            }
        },

        rowNames: function() {
            return columns[0].raw();
        },

        rowName: function(i) {
            if (!me.hasRowNames()) return '';
            var k = dataset.numRows;
            return columns[0].raw()[(i + k) % k];
        },

        // return the name of the first column
        rowNameLabel: function() {
            return columns[0].name();
        },

        /*
         * removes every row except the one with index i
         * and updates min, max and total of each series
         */
        filterRows: function(rows) {
            _.each(columns, function(col) {
                if (rows) col.filterRows(rows);
                else col.filterRows();
            });
        },

        /*
         * removes ignored series from dataset
         */
        filterSeries: function(ignore) {
            var me = this;
            me.__data.series = me.__data.series.filter(function(s) {
                return !ignore[s.name];
            });
        },

        /**
         * Returns true if the datasets row labels could
         * correctly be parsed as date values.
         */
        isTimeSeries: function() {
            return this.__rowDates !== undefined;
        },

        /**
         * Returns a Date object for a given row.
         */
        rowDate: function(i) {
            if (i < 0) i += this.__rowDates.length;
            return this.__rowDates[i];
        },

        /**
         * Returns (a copy of) the list of all rows Date objects.
         */
        rowDates: function() {
            return this.__rowDates.slice(0);
        },

        /**
         * Returns array of min/max values
         */
        minMax: function() {
            var minmax = [Number.MAX_VALUE, -Number.MAX_VALUE];
            this.eachSeries(function(s) {
                minmax[0] = Math.min(minmax[0], s.min);
                minmax[1] = Math.max(minmax[1], s.max);
            });
            return minmax;
        }

    };
    return dataset;
};

/*
 * OLD dataset model
 */
    // // Datawrapper.Dataset
    // // -------------------

    // //
    // var Dataset = Datawrapper.Dataset = function(options) {
    //     _.extend(options, {
    //         type: 'delimited'
    //     });
    //     this.__options = options;
    // };

    // _.extend(Dataset.prototype, {

    //     _initialize: function() {
    //         var me = this,
    //             opts = me.__options;
    //     },

    //     _fetchDelimited: function(callbacks) {
    //         var me = this,
    //             opts = me.__options;

    //         if (opts.url !== undefined) {
    //             if (me.__lastUrl == opts.url) {
    //                 // use cached data
    //                 loaded(me.__rawData);
    //             } else {
    //                 // load data from url
    //                 $.ajax({
    //                     url: opts.url,
    //                     method: 'GET',
    //                     dataType: "text", // NOTE (edouard): Without that jquery try to parse the content and return a Document
    //                     success: function(raw) {
    //                         me._delimtedLoaded(raw);
    //                         if (_.isFunction(callbacks.success)) {
    //                             callbacks.success();
    //                         }
    //                     }
    //                 });
    //             }
    //         }
    //     },

    //     _delimtedLoaded: function(raw, callbacks) {
    //         var me = this, opts = me.__options;
    //         me.__rawData = raw;
    //         // parse data
    //         var parser = new Datawrapper.Parsers.Delimited(opts),
    //             data = parser.parse(raw);
    //         me.__data = data;
    //         me.__loaded = true;
    //         me.__parser = parser;
    //         me._processData(data);
    //     },

    //     _processData: function(data) {
    //         var me = this,
    //             numParser = new NumberParser();
    //         me.__seriesByName = {};
    //         // at first we teach the parser all numbers we have
    //         _.each(data.series, function(s) {
    //             me.__seriesByName[s.name] = s;
    //             s._min = function() {
    //                 //console.warn('series._min() is deprecated, use series.min instead.');
    //                 return s.min;
    //             };
    //             s._max = function() {
    //                 //console.warn('series._max() is deprecated, use series.max instead.');
    //                 return s.max;
    //             };
    //             _.each(s.data, function(number) {
    //                 numParser.learn(number);
    //             });
    //         });
    //         // then we let parse the numbers
    //         _.each(data.series, function(s) {
    //             s.min = Number.MAX_VALUE;
    //             s.max = -Number.MAX_VALUE;
    //             s.total = 0;
    //             _.each(s.data, function(number, i) {
    //                 s.data[i] = numParser.parse(number);
    //                 if (!isNaN(s.data[i])) {
    //                     // this is buggy in IE7
    //                     s.min = Math.min(s.min, s.data[i]);
    //                     s.max = Math.max(s.max, s.data[i]);
    //                     s.total += s.data[i];
    //                 }
    //             });
    //             // store copy of original data in origdata
    //             s.origdata = s.data.slice();
    //         });
    //         // check if row names contain dates
    //         if (me.hasRowNames()) {
    //             var dateParser = new DateParser();
    //             me.eachRow(function(i) {
    //                 dateParser.learn(me.rowName(i));
    //             });
    //             if (dateParser.validFormat()) {
    //                 me.__dateFormat = dateParser.__format;
    //                 me.__rowDates = [];
    //                 me.eachRow(function(i) {
    //                     me.__rowDates.push(dateParser.parse(me.rowName(i)));
    //                 });
    //             }
    //         }
    //     },


    //     // PUBLIC API

    //     /*
    //      * loads a new dataset
    //      */
    //     fetch: function(callbacks) {
    //         var me = this, opts = me.__options;

    //         if (opts.type == "delimited") {
    //             me._fetchDelimited(callbacks);
    //         }
    //     },

    //     /*
    //      *
    //      */
    //     fetchRaw: function() {
    //         var me = this, opts = me.__options;
    //         if (opts.type == "delimited") {
    //             me._delimtedLoaded(opts.rawData);
    //         }
    //     },

    //     /*
    //      * returns either a single series by name or index, or a list of
    //      * all series, if no parameter x is given
    //      */
    //     series: function(x) {
    //         var me = this;
    //         if (_.isString(x)) {
    //             // single series by name
    //             if (me.__seriesByName[x] !== undefined) return me.__seriesByName[x];
    //             throw 'No series found with that name: "'+x+'"';
    //         }
    //         if (x !== undefined) {
    //             // single series by index
    //             if (me.__data.series[x] !== undefined) return me.__data.series[x];
    //             throw 'No series found with that index: '+x;
    //         }
    //         return this.__data.series;
    //     },

    //     hasRowNames: function() {
    //         return this.__data.rowNames !== undefined;
    //     },

    //     numRows: function() {
    //         return this.__data.series[0].data.length;
    //     },

    //     eachRow: function(func) {
    //         var i;
    //         for (i=0; i<this.numRows(); i++) {
    //             func(i);
    //         }
    //     },

    //     eachSeries: function(func) {
    //         _.each(this.series(), func);
    //     },

    //     rowNames: function() {
    //         return this.__data.rowNames;
    //     },

    //     rowName: function(i) {
    //         var me = this, k;
    //         if (!me.hasRowNames()) return '';
    //         k = me.__data.rowNames.length;
    //         return me.__data.rowNames[(i + k) % k];
    //     },

    //     rowNameLabel: function() {
    //         return this.__data.rowNameLabel !== undefined ? this.__data.rowNameLabel : '';
    //     },

    //     /*
    //      * removes every row except the one with index i
    //      * and updates min, max and total of each series
    //      */
    //     filterRows: function(rows) {
    //         this.eachSeries(function(s) {
    //             var d = [];
    //             s.total = 0;
    //             s.min = Number.MAX_VALUE;
    //             s.max = Number.MAX_VALUE*-1;
    //             _.each(rows, function(i) {
    //                 d.push(s.origdata[i]);
    //                 s.total += s.origdata[i];
    //                 s.min = Math.min(s.min, s.origdata[i]);
    //                 s.max = Math.max(s.max, s.origdata[i]);
    //             });
    //             s.data = d;
    //         });
    //     },

    //     /*
    //      * returns a tree data structure from this dataset
    //      */
    //     parseTree: function(row) {
    //         var tree = { children: [], depth: 0 };
    //         this.eachSeries(function(s) {
    //             var parts = s.name.split('>');
    //             var node = tree;
    //             _.each(parts, function(p, i) {
    //                 parts[i] = p = p.trim();
    //                 var found = false;
    //                 _.each(node.children, function(c) {
    //                     if (c.name.trim() == p) {
    //                         node = c;
    //                         found = true;
    //                         return false;
    //                     }
    //                 });
    //                 if (!found) { // child not found, create new one
    //                     var n = { name: p, children: [], _series: s, _row: 0, depth: i+1 };
    //                     if (i == parts.length-1) n.value = s.data[row];
    //                     node.children.push(n);
    //                     node = n;
    //                 }
    //             });
    //         });
    //         return tree;
    //     },

    //     serializeDelimited: function() {
    //         var me = this;
    //         var data = [[]];

    //         if (me.hasRowNames()) data[0].push('');

    //         function isNone(val) {
    //             return val === null || val === undefined || (_.isNumber(val) && isNaN(val));
    //         }

    //         _.each(me.series(), function(s) {
    //             data[0].push((!isNone(s.name) ? s.name : ''));
    //         });

    //         me.eachRow(function(row) {
    //             var tr = [];
    //             if (me.hasRowNames()) {
    //                 tr.push(!isNone(me.rowName(row)) ? me.rowName(row) : '');
    //             }
    //             me.eachSeries(function(s, i) {
    //                 var val = s.data[row];
    //                 tr.push((!isNone(s.data[row]) ? val : 'n/a'));
    //             });
    //             data.push(tr);
    //         });

    //         return data.map(function(row) { return row.join(me.__parser.delimiter); }).join('\n');
    //     },

    //     /*
    //      * removes ignored series from dataset
    //      */
    //     filterSeries: function(ignore) {
    //         var me = this;
    //         me.__data.series = me.__data.series.filter(function(s) {
    //             return !ignore[s.name];
    //         });
    //     },

    //     /**
    //      * Returns true if the datasets row labels could
    //      * correctly be parsed as date values.
    //      */
    //     isTimeSeries: function() {
    //         return this.__rowDates !== undefined;
    //     },

    //     /**
    //      * Returns a Date object for a given row.
    //      */
    //     rowDate: function(i) {
    //         if (i < 0) i += this.__rowDates.length;
    //         return this.__rowDates[i];
    //     },

    //     /**
    //      * Returns (a copy of) the list of all rows Date objects.
    //      */
    //     rowDates: function() {
    //         return this.__rowDates.slice(0);
    //     },

    //     /**
    //      * Returns array of min/max values
    //      */
    //     minMax: function() {
    //         var minmax = [Number.MAX_VALUE, -Number.MAX_VALUE];
    //         this.eachSeries(function(s) {
    //             minmax[0] = Math.min(minmax[0], s.min);
    //             minmax[1] = Math.max(minmax[1], s.max);
    //         });
    //         return minmax;
    //     }
    // });

    // var NumberParser = function() {
    //     this.__numbers = [];
    //     this.__knownFormats = {
    //         '-.': /^[\-\.]?[0-9]+(\.[0-9]+)?$/,
    //         '-,': /^[\-,]?[0-9]+(,[0-9]+)?$/,
    //         ',.': /^[0-9]{1,3}(,[0-9]{3})(\.[0-9]+)?$/,
    //         '.,': /^[0-9]{1,3}(\.[0-9]{3})(,[0-9]+)?$/,
    //         ' .': /^[0-9]{1,3}( [0-9]{3})(\.[0-9]+)?$/,
    //         ' ,': /^[0-9]{1,3}( [0-9]{3})(,[0-9]+)?$/
    //     };
    // };

    // _.extend(NumberParser.prototype, {

    //     // get some input numbers
    //     learn: function(number) {
    //         this.__numbers.push(number);
    //     },

    //     // test all numbers against certain
    //     _getFormat: function() {
    //         var me = this,
    //             matches = {},
    //             bestMatch = ['', 0];
    //         _.each(me.__numbers, function(n) {
    //             _.each(me.__knownFormats, function(regex, fmt) {
    //                 if (matches[fmt] === undefined) matches[fmt] = 0;
    //                 if (regex.test(n)) {
    //                     matches[fmt] += 1;
    //                     if (matches[fmt] > bestMatch[1]) {
    //                         bestMatch[0] = fmt;
    //                         bestMatch[1] = matches[fmt];
    //                     }
    //                 }
    //             });
    //         });
    //         return bestMatch[0];
    //     },

    //     parse: function(raw) {
    //         var me = this,
    //             number = raw,
    //             fmt = this.__format;
    //         if (raw === null || raw === undefined || raw === '') return 'n/a';
    //         if (fmt === undefined) {
    //             fmt = this.__format = this._getFormat();
    //         }
    //         // normalize number
    //         if (fmt[0] == ',' || fmt[0] == '.' || fmt[0] == ' ') {
    //             // remove kilo seperator
    //             number = number.replace(fmt[0], '');
    //         }
    //         if (fmt[1] != '.') {
    //             // replace decimal char w/ point
    //             number = number.replace(fmt[1], '.');
    //         }
    //         number = Number(number);
    //         return isNaN(number) ? raw : number;
    //     }

    // });

    // var DateParser = function() {
    //     var me = this;
    //     me.__dates = [];
    //     me.__knownFormats = {
    //         'year': /^([12][0-9]{3})$/,
    //         'quarter': /^([12][0-9]{3}) ?[\-\/Q|]([1234])$/,
    //         'month': /^([12][0-9]{3}) ?[-\/\.M](0[1-9]|1[0-2])$/,
    //         'date': /^([12][0-9]{3})[-\/](0[1-9]|1[0-2])[-\/]([0-2][0-9]|3[01])$/
    //     };
    // };

    // _.extend(DateParser.prototype, {
    //     // get some input numbers
    //     learn: function(date_str) {
    //         this.__dates.push(date_str);
    //     },

    //     // test all strings against the known formats
    //     _getFormat: function() {
    //         var me = this, format = false;
    //         _.each(me.__knownFormats, function(regex, fmt) {
    //             var valid = true;
    //             _.each(me.__dates, function(n) {
    //                 if (!regex.test(n)) {
    //                     valid = false;
    //                     return false;
    //                 }
    //             });
    //             if (valid) {
    //                 format = fmt;
    //                 return false;
    //             }
    //         });
    //         return format;
    //     },

    //     validFormat: function() {
    //         var me = this;
    //         me.__format = me._getFormat();
    //         return me.__format !== false;
    //     },

    //     parse: function(raw) {
    //         var me = this,
    //             date = raw,
    //             fmt = me.__format = me.__format === undefined ? me._getFormat() : me.__format;

    //         if (fmt === false) return raw;
    //         var regex = me.__knownFormats[fmt],
    //             m = raw.match(regex);

    //         if (!m) return raw;
    //         switch (fmt) {
    //             case 'year': return new Date(m[1], 0, 1);
    //             case 'quarter': return new Date(m[1], (m[2]-1) * 3, 1);
    //             case 'month': return new Date(m[1], (m[2]-1), 1);
    //             case 'date': return new Date(m[1], (m[2]-1), m[3]);
    //         }
    //         return raw;
    //     }
    // });


/*
 * DataColumn abstracts the functionality of each column
 * of a dataset. A column has a type (text|number|date).
 */
dw.column = function(name, rows, type) {

    function guessType() {

        if (_.every(rows, _.isNumber)) return dw.column.types.number();
        if (_.every(rows, _.isDate)) return dw.column.types.date();
        // guessing column type by counting parsing errors
        // for every known type
        var types = [
                dw.column.types.date(rows.slice(0, 20)),
                dw.column.types.number(rows.slice(0, 20)),
                dw.column.types.text()
            ],
            type,
            k = rows.length,
            tolerance = 0.1; // allowing 10% mis-parsed values

        _.each(rows, function(val) {
            _.each(types, function(t) {
                t.parse(val);
            });
        });
        _.every(types, function(t) {
            if (t.errors() / k < tolerance) type = t;
            return !type;
        });
        return type;
    }

    type = type ? dw.column.types[type](rows.slice(0, 50)) : guessType();

    var range,
        total,
        origRows = rows.slice(0);

    // public interface
    var column = {
        // column label
        name: function() {
            if (arguments.length) {
                name = arguments[0];
                return column;
            }
            return name;
        },
        // number of rows
        length: rows.length,
        // column.val(i) .. returns ith row of the col, parsed
        val: function(i) {
            return type.parse(rows[i]);
        },
        // each
        each: function(f) {
            for (i=0; i<rows.length; i++) {
                f(column.val(i), i);
            }
        },
        // access to raw values
        raw: function() { return rows; },
        // column type
        type: function() { return type.name(); },
        // [min,max] range
        range: function() {
            if (!type.toNum) return false;
            if (!range) {
                range = [Number.MAX_VALUE, -Number.MAX_VALUE];
                column.each(function(v) {
                    v = type.toNum(v);
                    if (v < range[0]) range[0] = v;
                    if (v > range[1]) range[1] = v;
                });
                range[0] = type.fromNum(range[0]);
                range[1] = type.fromNum(range[1]);
            }
            return range;
        },
        // sum of values
        total: function() {
            if (!type.toNum) return false;
            if (!total) {
                total = 0;
                column.each(function(v) {
                    total += type.toNum(v);
                });
                total = type.fromNum(total);
            }
            return total;
        },
        // remove rows from column, keep those whose index
        // is within @r
        filterRows: function(r) {
            rows = [];
            if (arguments.length) {
                _.each(r, function(i) {
                    rows.push(origRows[i]);
                });
            } else {
                rows = origRows.slice(0);
            }
            column.length = rows.length;
            // invalidate range and total
            range = total = false;
            return column;
        },

        toString: function() {
            return name + ' ('+type.name()+')';
        }
    };
    return column;
};

dw.column.types = {};


dw.column.types.text = function() {
    return {
        parse: function(v) { return v; },
        errors: function() { return 0; },
        name: function() { return 'text'; }
    };
};

/*
 * A type for numbers:
 *
 * Usage:
 * var parse = dw.type.number(sampleData);
 * parse()
 */
dw.column.types.number = function(sample) {

    var format,
        errors = 0,
        knownFormats = {
            '-.': /^ *-?[0-9]*(\.[0-9]+)? *$/,
            '-,': /^ *-?[0-9]*(,[0-9]+)? *$/,
            ',.': /^ *-?[0-9]{1,3}(,[0-9]{3})*(\.[0-9]+)? *$/,
            '.,': /^ *-?[0-9]{1,3}(\.[0-9]{3})*(,[0-9]+)? *$/,
            ' .': /^ *-?[0-9]{1,3}( [0-9]{3})*(\.[0-9]+)? *$/,
            ' ,': /^ *-?[0-9]{1,3}( [0-9]{3})*(,[0-9]+)? *$/,
            // excel sometimes produces a strange white-space:
            ' .': /^ *-?[0-9]{1,3}( [0-9]{3})*(\.[0-9]+)? *$/,
            ' ,': /^ *-?[0-9]{1,3}( [0-9]{3})*(,[0-9]+)? *$/
        };

    var matches = {},
        bestMatch = ['-.', 0];

    sample = sample || [];

    _.each(sample, function(n) {
        _.each(knownFormats, function(regex, fmt) {
            if (matches[fmt] === undefined) matches[fmt] = 0;
            if (regex.test(n)) {
                matches[fmt] += 1;
                if (matches[fmt] > bestMatch[1]) {
                    bestMatch[0] = fmt;
                    bestMatch[1] = matches[fmt];
                }
            }
        });
    });
    format = bestMatch[0];

    // public interface
    var type = {
        parse: function(raw) {
            if (_.isNumber(raw)) return raw;
            var number = raw;
            // normalize number
            if (format[0] != '-') {
                // remove kilo seperator
                number = number.replace(format[0], '');
            }
            if (format[1] != '.') {
                // replace decimal char w/ point
                number = number.replace(format[1], '.');
            }
            number = Number(number);
            if (isNaN(number)) {
                errors++;
                return raw;
            }
            return number;
        },
        toNum: function(i) { return i; },
        fromNum: function(i) { return i; },
        errors: function() { return errors; },
        name: function() { return 'number'; }
    };
    return type;
};


/*
 * type for date values, e.g. 2004 Q1
 */
dw.column.types.date = function(sample) {

    var format,
        errors = 0,
        matches = {},
        bestMatch = ['', 0],
        knownFormats = {
            'YYYY': /^ *([12][0-9]{3}) *$/,
            'YYYY-H': /^ *([12][0-9]{3})[ \-\/]?H([12]) *$/,
            'H-YYYY': /^ *H([12])[ \-\/]([12][0-9]{3}) *$/,
            'YYYY-Q': /^ *([12][0-9]{3})[ \-\/]?Q([1234]) *$/,
            'Q-YYYY': /^ *Q([1234])[ \-\/]([12][0-9]{3}) *$/,
            'YYYY-M': /^ *([12][0-9]{3}) ?[ -\/\.](0?[1-9]|1[0-2]) *$/,
            'M-YYYY': /^ *(0?[1-9]|1[0-2]) ?[ -\/\.]([12][0-9]{3}) *$/,
            'MM/DD/YYYY': /^ *(0?[1-9]|1[0-2])([-\/] ?)(0?[1-9]|[1-2][0-9]|3[01])\2([12][0-9]{3})(?: (0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?)? *$/,
            'DD.MM.YYYY': /^ *(0?[1-9]|[1-2][0-9]|3[01])([-\.\/ ?])(0?[1-9]|1[0-2])\2([12][0-9]{3})(?: (0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?)? *$/,
            'YYYY-MM-DD': /^ *([12][0-9]{3})([-\/\. ?])(0?[1-9]|1[0-2])\2(0?[1-9]|[1-2][0-9]|3[01])(?: (0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?)? *$/
        };

    sample = sample || [];

    _.each(sample, function(n) {
        _.each(knownFormats, function(regex, fmt) {
            if (matches[fmt] === undefined) matches[fmt] = 0;
            if (regex.test(n)) {
                matches[fmt] += 1;
                if (matches[fmt] > bestMatch[1]) {
                    bestMatch[0] = fmt;
                    bestMatch[1] = matches[fmt];
                }
            }
        });
    });
    format = bestMatch[0];

    // public interface
    var type = {
        parse: function(raw) {
            if (_.isDate(raw)) return raw;
            if (format === false || !_.isString(raw)) {
                errors++;
                return raw;
            }
            var regex = knownFormats[format],
                m = raw.match(regex);

            if (!m) {
                errors++;
                console.log('err', raw, regex);
                return raw;
            }
            switch (format) {
                case 'YYYY': return new Date(m[1], 0, 1);
                case 'YYYY-H': return new Date(m[1], (m[2]-1) * 6, 1);
                case 'H-YYYY': return new Date(m[2], (m[1]-1) * 6, 1);
                case 'YYYY-Q': return new Date(m[1], (m[2]-1) * 3, 1);
                case 'Q-YYYY': return new Date(m[2], (m[1]-1) * 3, 1);
                case 'YYYY-M': return new Date(m[1], (m[2]-1), 1);
                case 'M-YYYY': return new Date(m[2], (m[1]-1), 1);
                case 'YYYY-MM-DD': return new Date(m[1], (m[3]-1), m[4], m[5] || 0, m[6] || 0, m[7] || 0);
                case 'DD.MM.YYYY': return new Date(m[4], (m[3]-1), m[1], m[5] || 0, m[6] || 0, m[7] || 0);
                case 'MM/DD/YYYY': return new Date(m[4], (m[1]-1), m[3], m[5] || 0, m[6] || 0, m[7] || 0);
            }
            errors++;
            return raw;
        },
        toNum: function(d) { return d.getTime(); },
        fromNum: function(i) { return new Date(i); },
        errors: function() { return errors; },
        name: function() { return 'date'; }
    };
    return type;
};

// namespace for dataset sources

// API for sources is
//
// dw.datasource.delimited(opts).dataset();
//
dw.datasource = {};
/*
* dataset source for delimited files (CSV, TSV, ...)
*/

/**
* Smart delimited data parser.
* - Handles CSV and other delimited data.
* Includes auto-guessing of delimiter character
* Parameters:
*   options
*     delimiter : ","
*/


dw.datasource.delimited = function(opts) {

    function loadAndParseCsv() {
        if (opts.url) {
            return $.ajax({
                url: opts.url,
                method: 'GET',
                dataType: "text" // NOTE (edouard): Without that jquery try to parse the content and return a Document
            }).then(function(raw) {
                return new DelimitedParser(opts).parse(raw);
            });
        } else if (opts.csv) {
            var dfd = $.Deferred(),
                parsed = dfd.then(function(raw) {
                return new DelimitedParser(opts).parse(raw);
            });
            dfd.resolve(opts.csv);
            return parsed;
        }
        throw 'you need to provide either an URL or CSV data.';
    }

    var delimited = {
        dataset: function() {
            return loadAndParseCsv();
        }
    };
    return delimited;
};


var DelimitedParser = function(opts) {

    opts = _.extend({
        delimiter: "auto",
        quoteChar: "\"",
        skipRows: 0,
        emptyValue: null,
        transpose: false,
        firstRowIsHeader: true,
        firstColumnIsHeader: true
    }, opts);

    this.__delimiterPatterns = getDelimiterPatterns(opts.delimiter, opts.quoteChar);
    this.opts = opts;
};

function getDelimiterPatterns(delimiter, quoteChar) {
    return new RegExp(
    (
    // Delimiters.
    "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
    // Quoted fields.
    "(?:" + quoteChar + "([^" + quoteChar + "]*(?:" + quoteChar + "\"[^" + quoteChar + "]*)*)" + quoteChar + "|" +
    // Standard fields.
    "([^" + quoteChar + "\\" + delimiter + "\\r\\n]*))"), "gi");
}

_.extend(DelimitedParser.prototype, {

    parse: function(data) {

        var me = this,
            opts = this.opts;

        me.__rawData = data;

        if (opts.delimiter == 'auto') {
            opts.delimiter = me.guessDelimiter(data, opts.skipRows);
            me.__delimiterPatterns = getDelimiterPatterns(opts.delimiter, opts.quoteChar);
        }
        var columns = [],
            closure = opts.delimiter != '|' ? '|' : '#',
            arrData;

        data = closure + data.replace(/\s+$/g, '') + closure;

        function parseCSV(delimiterPattern, strData, strDelimiter) {
            // implementation and regex borrowed from:
            // http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm

            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [
                []
            ];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null,
                strMatchedValue;

            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = delimiterPattern.exec(strData)) {
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[1];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (
                    strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {

                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push([]);

                }


                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[2]) {

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");

                } else {

                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[3];

                }


                // Now that we have our value string, let's add
                // it to the data array.
                arrData[arrData.length - 1].push(strMatchedValue);
            }

            // remove closure
            if (arrData[0][0].substr(0, 1) == closure) {
                arrData[0][0] = arrData[0][0].substr(1);
            }
            var p = arrData.length - 1,
                q = arrData[p].length - 1,
                r = arrData[p][q].length - 1;
            if (arrData[p][q].substr(r) == closure) {
                arrData[p][q] = arrData[p][q].substr(0, r);
            }

            // Return the parsed data.
            return (arrData);
        } // end parseCSV

        function transpose(arrMatrix) {
            // borrowed from:
            // http://www.shamasis.net/2010/02/transpose-an-array-in-javascript-and-jquery/
            var a = arrMatrix,
                w = a.length ? a.length : 0,
                h = a[0] instanceof Array ? a[0].length : 0;
            if (h === 0 || w === 0) {
                return [];
            }
            var i, j, t = [];
            for (i = 0; i < h; i++) {
                t[i] = [];
                for (j = 0; j < w; j++) {
                    t[i][j] = a[j][i];
                }
            }
            return t;
        }

        function makeDataset(arrData, skipRows, emptyValue, firstRowIsHeader, firstColIsHeader) {
            var columns = [],
                columnNames = {},
                rowCount = arrData.length,
                columnCount = arrData[0].length,
                rowIndex = skipRows;

            // compute series
            var srcColumns = [];
            if (firstRowIsHeader) {
                srcColumns = arrData[rowIndex];
                rowIndex++;
            }

            // check that columns names are unique and not empty

            for (var c = 0; c < columnCount; c++) {
                var col = _.isString(srcColumns[c]) ? srcColumns[c].replace(/^\s+|\s+$/g, '') : '',
                    suffix = col !== '' ? '' : 1;
                col = col !== '' ? col : 'X.';
                while (columnNames[col + suffix] !== undefined) {
                    suffix = suffix === '' ? 1 : suffix + 1;
                }
                columns.push({
                    name: col + suffix,
                    data: []
                });
                columnNames[col + suffix] = true;
            }

            _.each(_.range(1, rowCount), function(rowIndex) {
                _.each(columns, function(c, i) {
                    c.data.push(arrData[rowIndex][i] !== '' ? arrData[rowIndex][i] : emptyValue);
                });
            });

            columns = _.map(columns, function(c) { return dw.column(c.name, c.data); });
            return dw.dataset(columns, { firstColumnAsLabel: firstColIsHeader });
        } // end makeDataset

        arrData = parseCSV(this.__delimiterPatterns, data, opts.delimiter);
        if (opts.transpose) {
            arrData = transpose(arrData);
            // swap row/column header setting
            var t = opts.firstRowIsHeader;
            opts.firstRowIsHeader = opts.firstColumnIsHeader;
            opts.firstColumnIsHeader = t;
        }
        return makeDataset(arrData, opts.skipRows, opts.emptyValue, opts.firstRowIsHeader, opts.firstColumnIsHeader);
    }, // end parse


    guessDelimiter: function(strData) {
        // find delimiter which occurs most often
        var maxMatchCount = 0,
            k = -1,
            me = this,
            delimiters = ['\t', ';', '|', ','];
        _.each(delimiters, function(delimiter, i) {
            var regex = getDelimiterPatterns(delimiter, me.quoteChar),
                c = strData.match(regex).length;
            if (c > maxMatchCount) {
                maxMatchCount = c;
                k = i;
            }
        });
        return delimiters[k];
    }

}); // end _.extend(DelimitedParser)


    // Datawrapper.Chart
    // -----------------

    //
    var Chart = Datawrapper.Chart = function(attributes) {
        this.__attributes = attributes;
    };

    _.extend(Chart.prototype, {

        get: function(key, _default) {
            var keys = key.split('.'),
                pt = this.__attributes;

            _.each(keys, function(key) {
                if (pt === undefined) {
                    return _default;
                }
                pt = pt[key];
            });
            return _.isUndefined(pt) || _.isNull(pt) ? _default : pt;
        },

        // loads the dataset of this chart
        dataset: function(callback, ignoreTranspose) {
            var me = this, ds, dsOpts = {
                delimiter: 'auto',
                url: 'data',
                transpose: ignoreTranspose ? false : this.get('metadata.data.transpose', false),
                firstRowIsHeader: this.get('metadata.data.horizontal-header', true),
                firstColumnIsHeader: this.get('metadata.data.vertical-header', true)
            };
            me.__dataset = ds = new Datawrapper.Dataset(dsOpts);
            ds.fetch({
                success: function() {
                    callback(ds);
                    if (me.__datasetLoadedCallbacks) {
                        for (var i=0; i<me.__datasetLoadedCallbacks.length; i++) {
                            me.__datasetLoadedCallbacks[i](me);
                        }
                    }
                }
            });
            return ds;
        },

        rawData: function(rawData) {
            var me = this,
                dsOpts = {
                    rawData: rawData,
                    delimiter: 'auto',
                    transpose: this.get('metadata.data.transpose', false),
                    firstRowIsHeader: this.get('metadata.data.horizontal-header', true),
                    firstColumnIsHeader: this.get('metadata.data.vertical-header', true)
                };
            me.__dataset = ds = new Datawrapper.Dataset(dsOpts);
            ds.fetchRaw();
        },

        datasetLoaded: function(callback) {
            var me = this;
            if (me.__dataset.__loaded) {
                // run now
                callback(me);
            } else {
                if (!me.__datasetLoadedCallbacks) me.__datasetLoadedCallbacks = [];
                me.__datasetLoadedCallbacks.push(callback);
            }
        },

        dataSeries: function(sortByFirstValue, reverseOrder) {
            var me = this;
            ds = [];
            me.__dataset.eachSeries(function(series, i) {
                ds.push(series);
            });
            if (sortByFirstValue === true) {
                ds = ds.sort(function(a,b) {
                    return b.data[0] > a.data[0] ? 1 : -1;
                });
            } else if ($.type(sortByFirstValue) == "number") {
                ds = ds.sort(function(a,b) {
                    return b.origdata[sortByFirstValue] > a.origdata[sortByFirstValue] ? 1 : -1;
                });
            }
            if (reverseOrder) ds.reverse();
            return ds;
        },

        seriesByName: function(name) {
            return this.__dataset.series(name);
        },

        numRows: function() {
            return this.__dataset.numRows();
        },

        // column header is the first value of each data series
        hasColHeader:  function(invert) {
            var t = this.get('metadata.data.transpose');
            if (invert ? !t : t) {
                return this.get('metadata.data.vertical-header');
            } else {
                return this.get('metadata.data.horizontal-header');
            }
        },

        // row header is the first data series
        hasRowHeader: function() {
            return this.hasColHeader(true);
        },

        rowHeader: function() {
            var ds = this.__dataset;
            return this.hasRowHeader() ? { data: ds.rowNames() } : false;
        },

        rowLabels: function() {
            //console.warn('chart.rowLabels() is marked deprecated. Use chart.dataset().rowNames() instead');
            if (this.hasRowHeader()) {
                return this.rowHeader().data;
            } else {
                var rh = [];
                for (var i=0; i<this.numRows(); i++) rh.push('Row '+(i+1));
                return rh;
            }
        },

        rowLabel: function(r) {
            if (this.hasRowHeader()) {
                return this.rowHeader().data[r];
            } else {
                return r;
            }
        },

        hasHighlight: function() {
            var hl = this.get('metadata.visualize.highlighted-series');
            return _.isArray(hl) && hl.length > 0;
        },

        isHighlighted: function(col) {
            if (col === undefined) return false;
            var hl = this.get('metadata.visualize.highlighted-series');
            return !_.isArray(hl) || hl.length === 0 || _.indexOf(hl, col.name) >= 0;
        },

        setLocale: function(locale, metric_prefix) {
            Globalize.culture(locale);
            this.locale = locale;
            this.metric_prefix = metric_prefix;
        },

        formatValue: function(val, full, round) {
            var me = this,
                format = me.get('metadata.describe.number-format'),
                div = Number(me.get('metadata.describe.number-divisor')),
                append = me.get('metadata.describe.number-append', '').replace(' ', '&nbsp;'),
                prepend = me.get('metadata.describe.number-prepend', '').replace(' ', '&nbsp;');

            if (div !== 0) val = Number(val) / Math.pow(10, div);
            if (format != '-') {
                if (round || val == Math.round(val)) format = format.substr(0,1)+'0';
                val = Globalize.format(val, format);
            } else if (div !== 0) {
                val = val.toFixed(1);
            }

            return full ? prepend + val + append : val;
        },

        /*
         * filter to a single row in the dataset
         */
        filterRow: function(row) {
            this.__dataset.filterRows([row]);
        },

        filterRows: function(rows) {
            this.__dataset.filterRows(rows);
        },

        hasMissingValues: function() {
            var missValues = false;
            _.each(this.dataSeries(), function(ds) {
                _.each(ds.data, function(val) {
                    if (val != Number(val)) {
                        missValues = true;
                        return false;
                    }
                });
                if (missValues) return false;
            });
            return missValues;
        }

    });


    // Datawrapper.EditableChart
    // -------------------------

    //
    var EditableChart = Datawrapper.EditableChart = function(attributes) {
        var me = this;
        me.__attributes = attributes;
        me.__changed = false;
        me.__changeCallbacks = [];
        me.__saveCallbacks = [];
        me.__syncedElements = [];
    };

    _.extend(EditableChart.prototype, Datawrapper.Chart.prototype, {

        set: function(key, value) {
            var keys = key.split('.'),
                me = this,
                lastKey = keys.pop(),
                pt = me.__attributes;

            // resolve property until the parent dict
            _.each(keys, function(key) {
                if (_.isArray(pt[key]) && pt[key].length === 0) {
                    pt[key] = {};
                }
                pt = pt[key];
            });

            // check if new value is set
            if (!_.isEqual(pt[lastKey], value)) {
                pt[lastKey] = value;
                me.__changed = true;
                clearTimeout(me.__saveTimeout);
                me.__saveTimeout = setTimeout(function() {
                    me.save();
                }, 800);
                _.each(me.__changeCallbacks, function(cb) {
                    cb.call(this, me, key, value);
                });
            }
            return this;
        },

        onChange: function(callback) {
            this.__changeCallbacks.push(callback);
        },

        sync: function(el, attribute, _default) {
            if (_.isString(el)) el = $(el);
            el.data('sync-attribute', attribute);

            // initialize current state in UI
            var curVal = this.get(attribute, _default);
            if (el.is('input[type=checkbox]')) {
                if (curVal) el.attr('checked', 'checked');
                else el.removeAttr('checked');
            } else if (el.is('input[type=text]') || el.is('textarea') || el.is('select')) {
                el.val(curVal);
            } else if (el.is('input[type=radio]')) {
                if (_.isBoolean(curVal)) {
                    curVal = curVal ? 'yes' : 'no';
                }
                $('input:radio[name='+el.attr('name')+'][value='+curVal+']').attr('checked', 'checked');
            }

            var chart = this;

            chart.__syncedElements.push(el);

            function storeElementValue(el) {
                var attr, val;
                // Resolve attribute string to a pointer to the attribute
                attr = el.data('sync-attribute');

                if (el.is('input[type=checkbox]')) {
                    val = el.attr('checked') == 'checked';
                } else if (el.is('input[type=text]') || el.is('textarea') || el.is('select')) {
                    val = el.val();
                } else if (el.is('input[type=radio]')) {
                    val = $('input:radio[name='+el.attr('name')+']:checked').val();
                    if (val === 'yes') val = true;
                    else if (val === 'no') val = false;
                }
                if (val !== undefined) {
                    chart.set(attr, val);
                }
            }

            el.change(function(evt) {
                storeElementValue($(evt.target));
            });

            if (el.is('input[type=text]') || el.is('textarea')) {
                el.keyup(function(evt) {
                    storeElementValue($(evt.target));
                });
            }

            window.onbeforeunload = function(e) {
                //console.debug('onbeforeunload()');
                if (chart.__changed) return 'Caution: unsaved changes';
                //_.each(chart.__syncedElements, storeElementValue);
                //var res = chart.save();
                //if (res === false) return undefined;
                //return 'Please wait a second until the data has been saved!';
            };
        },

        onSave: function(callback) {
            this.__saveCallbacks.push(callback);
        },

        save: function(sync) {
            // saves the chart meta data to Datawrapper
            //console.debug('save()', this.__changed);
            if (!this.__changed) return false;
            clearTimeout(this.__saveTimeout);
            var chart = this;
            $.ajax({
                url: '/api/charts/'+this.get('id'),
                type: 'PUT',
                dataType: 'json',
                data: JSON.stringify(this.__attributes),
                processData: false,
                context: this,
                success: function(data) {
                    //console.debug('save completed');
                    if (data.status == "ok") {
                        this.__changed = false;
                        // run callbacks
                        _.each(this.__saveCallbacks, function(cb) {
                            cb.call(this, chart);
                        });
                    } else {
                        console.warn('could not save the chart', data);
                    }
                }
            });
            return true;
        }
    });

(function(){

    // Datawrapper.Theme
    // -----------------

    // Every theme will inherit the properties of this
    // theme. They can override everything or just a bit
    // of them. Also, every theme can extend any other
    // existing theme.

    Datawrapper.Themes = {};

    Datawrapper.Themes.Base = _.extend({}, {

        /*
         * colors used in the theme
         */
        colors: {
            palette: ['#6E7DA1', '#64A4C4', '#53CCDD',  '#4EF4E8'],
            secondary: ["#000000", '#777777', '#cccccc', '#ffd500', '#6FAA12'],

            positive: '#85B4D4',
            negative: '#E31A1C',
            // colors background and text needs to be set in CSS as well!
            background: '#ffffff',
            text: '#000000'
        },

        /*
         * padding around the chart area
         */
        padding: {
            left: 0,
            right: 20,
            bottom: 30,
            top: 10
        },

        /*
         * custom properties for line charts
         */
        lineChart: {
            // stroke width used for lines, in px
            strokeWidth: 3,
            // the maximum width of direct labels, in px
            maxLabelWidth: 80,
            // the opacity used for fills between two lines
            fillOpacity: 0.2,
            // distance between labels and x-axis
            xLabelOffset: 20
        },

        /*
         * custom properties for column charts
         */
        columnChart: {
            // if set to true, the horizontal grid lines are cut
            // so that they don't overlap with the grid label.
            cutGridLines: false,
            // you can customize bar attributes
            barAttrs: {
                'stroke-width': 1
            }
        },

        /*
         * custom properties for bar charts
         */
        barChart: {
            // you can customize bar attributes
            barAttrs: {
                'stroke-width': 1
            }
        },

        /*
         * attributes of x axis, if there is any
         */
        xAxis: {
            stroke: '#333'
        },

        /*
         * attributes of y-axis if there is any shown
         */
        yAxis: {
            strokeWidth: 1
        },


        /*
         * attributes applied to horizontal grids if displayed
         * e.g. in line charts, column charts, ...
         *
         * you can use any property that makes sense on lines
         * such as stroke, strokeWidth, strokeDasharray,
         * strokeOpacity, etc.
         */
        horizontalGrid: {
            stroke: '#d9d9d9'
        },

        /*
         * just like horizontalGrid. used in line charts only so far
         *
         * you can define the grid line attributes here, e.g.
         * verticalGrid: { stroke: 'black', strokeOpacity: 0.4 }
         */
        verticalGrid: false,

        /*
         * draw a frame around the chart area (only in line chart)
         *
         * you can define the frame attributes here, e.g.
         * frame: { fill: 'white', stroke: 'black' }
         */
        frame: false,

        /*
         * if set to true, the frame border is drawn separately above
         * the other chart elements
         */
        frameStrokeOnTop: false,

        /*
         * probably deprecated
         */
        yTicks: false,


        hover: true,
        tooltip: true,

        hpadding: 0,
        vpadding: 10,

        /*
         * some chart types (line chart) go into a 'compact'
         * mode if the chart width is below this value
         */
        minWidth: 400,

        /*
         * theme locale, probably unused
         */
        locale: 'de_DE',

        /*
         * duration for animated transitions (ms)
         */
        duration: 1000,

        /*
         * easing for animated transitions
         */
         easing: 'expoInOut'

    });

}).call(this);
      // Datawrapper.Parsers.Delimited
      // -----------------------------

   Datawrapper.Parsers = {};

   /**
    * Smart delimited data parser.
    * - Handles CSV and other delimited data.
    * Includes auto-guessing of delimiter character
    * Parameters:
    *   options
    *     delimiter : ","
    */
   Datawrapper.Parsers.Delimited = function(options) {
      options = options || {};

      this.delimiter = options.delimiter || ",";

      this.quoteChar = options.quoteChar || "\"";

      this.skipRows = options.skipRows || 0;

      this.emptyValue = options.emptyValue || null;

      this.transpose = options.transpose || false;

      this.firstRowIsHeader = options.firstRowIsHeader !== undefined ? options.firstRowIsHeader : true;

      this.firstColumnIsHeader = options.firstRowIsHeader !== undefined ? options.firstColumnIsHeader : true;

      this.getDelimiterPatterns = function(delimiter, quoteChar) {
         return new RegExp(
            (
            // Delimiters.
            "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
            // Quoted fields.
            "(?:" + quoteChar + "([^" + quoteChar + "]*(?:" + quoteChar + "\"[^" + quoteChar + "]*)*)" + quoteChar + "|" +
            // Standard fields.
            "([^" + quoteChar + "\\" + delimiter + "\\r\\n]*))"), "gi");
      };

      this.__delimiterPatterns = this.getDelimiterPatterns(this.delimiter, this.quoteChar);
   };


   _.extend(Datawrapper.Parsers.Delimited.prototype, Datawrapper.Parsers.prototype, {

      parse: function(data) {

         this.__rawData = data;

         if (this.delimiter == 'auto') {
            this.delimiter = this.guessDelimiter(data, this.skipRows);
            this.__delimiterPatterns = this.getDelimiterPatterns(this.delimiter, this.quoteChar);

         }
         var columns = [],
            closure = this.delimiter != '|' ? '|' : '#',
            arrData;

         data = closure + data.replace(/\s+$/g, '') + closure;

         var parseCSV = function(delimiterPattern, strData, strDelimiter) {
            // implementation and regex borrowed from:
            // http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm

            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [
               []
            ];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null,
               strMatchedValue;

            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = delimiterPattern.exec(strData)) {
               // Get the delimiter that was found.
               var strMatchedDelimiter = arrMatches[1];

               // Check to see if the given delimiter has a length
               // (is not the start of string) and if it matches
               // field delimiter. If id does not, then we know
               // that this delimiter is a row delimiter.
               if (
               strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {

                  // Since we have reached a new row of data,
                  // add an empty row to our data array.
                  arrData.push([]);

               }


               // Now that we have our delimiter out of the way,
               // let's check to see which kind of value we
               // captured (quoted or unquoted).
               if (arrMatches[2]) {

                  // We found a quoted value. When we capture
                  // this value, unescape any double quotes.
                  strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");

               } else {

                  // We found a non-quoted value.
                  strMatchedValue = arrMatches[3];

               }


               // Now that we have our value string, let's add
               // it to the data array.
               arrData[arrData.length - 1].push(strMatchedValue);
            }

            // remove closure
            if (arrData[0][0].substr(0,1) == closure) {
               arrData[0][0] = arrData[0][0].substr(1);
            }
            var p = arrData.length-1,
               q = arrData[p].length-1,
               r = arrData[p][q].length-1;
            if (arrData[p][q].substr(r) == closure) {
               arrData[p][q] = arrData[p][q].substr(0, r);
            }

            // Return the parsed data.
            return (arrData);
         },

         transpose = function(arrMatrix) {
            // borrowed from:
            // http://www.shamasis.net/2010/02/transpose-an-array-in-javascript-and-jquery/
            var a = arrMatrix,
               w = a.length ? a.length : 0,
               h = a[0] instanceof Array ? a[0].length : 0;
            if (h === 0 || w === 0) {
               return [];
            }
            var i, j, t = [];
            for (i = 0; i < h; i++) {
               t[i] = [];
               for (j = 0; j < w; j++) {
                  t[i][j] = a[j][i];
               }
            }
            return t;
         };

         parseDataArray = function(arrData, skipRows, emptyValue, firstRowIsHeader, firstColIsHeader) {
            var series = [],
               seriesNames = {},
               rowCount = arrData.length,
               columnCount = arrData[0].length,
               rowIndex = skipRows;

            // compute series
            var srcColumns = [];
            if (firstRowIsHeader) {
               srcColumns = arrData[rowIndex];
               rowIndex++;
            }

            // check that columns names are unique and not empty

            for (var c=0; c<columnCount; c++) {
               var col = _.isString(srcColumns[c]) ? srcColumns[c].replace(/^\s+|\s+$/g, '') : '',
                  suffix = col !== '' ? '' : 1;
               col = col !== '' ? col : 'X.';
               while (seriesNames[col+suffix] !== undefined) {
                  suffix = suffix === '' ? 1 : suffix + 1;
               }
               series.push({ name: col+suffix, data: [] });
               seriesNames[col+suffix] = true;
            }

            for (; rowIndex < rowCount; rowIndex++) {
               _.each(series, function(s, i) {
                  s.data.push(arrData[rowIndex][i] !== '' ? arrData[rowIndex][i] : emptyValue);
               });
            }

            var header;
            if (firstColIsHeader) {
               header = series[0];
               series = series.slice(1);
            }

            return {
               series: series,
               rowNames: header ? header.data : undefined,
               rowNameLabels: header ? header.name : undefined
            };
         }, // end parseDataArray

         arrData = parseCSV(this.__delimiterPatterns, data, this.delimiter);
         if (this.transpose) {
            arrData = transpose(arrData);
            // swap row/column header setting
            var t = this.firstRowIsHeader;
            this.firstRowIsHeader = this.firstColumnIsHeader;
            this.firstColumnIsHeader = t;
         }
         return parseDataArray(arrData, this.skipRows, this.emptyValue, this.firstRowIsHeader, this.firstColumnIsHeader);
      },

      guessDelimiter: function(strData) {
         // find delimiter which occurs most often
         var maxMatchCount = 0,
            k = -1,
            me = this,
            delimiters = ['\t',';','|',','];
         _.each(delimiters, function(delimiter, i) {
            var regex = me.getDelimiterPatterns(delimiter, me.quoteChar),
               c = strData.match(regex).length;
            if (c > maxMatchCount) {
               maxMatchCount = c;
               k = i;
            }
         });
         return delimiters[k];
      }

   });


    // Datawrapper.Visualization.Base
    // ------------------------------

    // Every visualization should extend this class.
    // It provides the basic API between the chart template
    // page and the visualization class.

    Datawrapper.Visualizations = {};

    var Base = function() {

    };

    _.extend(Base.prototype, {

        render: function(el) {
            $(el).html('implement me!');
        },

        setTheme: function(theme) {
            this.theme = theme;
            var attr_properties = ['horizontalGrid', 'verticalGrid', 'yAxis', 'xAxis'];
            _.each(attr_properties, function(prop) {
                // convert camel-case to dashes
                if (theme.hasOwnProperty(prop)) {
                    for (var key in theme[prop]) {
                        // dasherize
                        var lkey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                        if (!theme[prop].hasOwnProperty(lkey)) {
                            theme[prop][lkey] = theme[prop][key];
                        }
                    }
                }
            });
            return this;
        },

        setSize: function(width, height) {
            var me = this;
            me.__w = width;
            me.__h = height;
            return me;
        },

        load: function(chart, callback) {
            var me = this;
            this.chart = chart;
            chart.dataset(function(ds) {
                me.dataset = ds;
                me.dataset.filterSeries(chart.get('metadata.data.ignore-series', {}));
                callback.call(me, me);
            });
        },

        /**
         * short-cut for this.chart.get('metadata.visualizes.*')
         */
        get: function(str, _default) {
            return this.chart.get('metadata.visualize.'+str, _default);
        },

        warn: function(str) {
            var warning = $('<div>' + str + '</div>');
            warning.css({
                'background-color': '#FCF8E3',
                'border': '1px solid #FBEED5',
                'border-radius': '4px 4px 4px 4px',
                'color': '#a07833',
                'margin-bottom': '18px',
                'padding': '8px 35px 8px 14px',
                'text-shadow': '0 1px 0 rgba(255, 255, 255, 0.5)',
                'left': '10%',
                'right': '10%',
                'z-index': 1000,
                'text-align': 'center',
                position: 'absolute'
            });
            $('body').prepend(warning);
            warning.hide();
            warning.fadeIn();
        },

        /**
         * returns a signature for this visualization which will be used
         * to test correct rendering of the chart in different browsers.
         * See raphael-chart.js for example implementation.
         */
        signature: function() {
            // nothing here, please overload
        },

        translate: function(str) {
            var locale = this.meta.locale, lang = this.lang;
            return locale[str] ? locale[str][lang] || locale[str] : str;
        }

    });

    Datawrapper.Visualizations.Base = Base.prototype;


}).call(this);