"use strict";

var _slicedToArray = (function () {
	function sliceIterator(arr, i) {
		var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
			for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
				_arr.push(_s.value);if (i && _arr.length === i) break;
			}
		} catch (err) {
			_d = true;_e = err;
		} finally {
			try {
				if (!_n && _i['return']) _i['return']();
			} finally {
				if (_d) throw _e;
			}
		}return _arr;
	}return function (arr, i) {
		if (Array.isArray(arr)) {
			return arr;
		} else if (Symbol.iterator in Object(arr)) {
			return sliceIterator(arr, i);
		} else {
			throw new TypeError('Invalid attempt to destructure non-iterable instance');
		}
	};
})();

var expect = require('chai').expect;
var Job = require('job-mock');
var colors = require('colors');
var Promise = require('bluebird');

describe('Job-Mock', function () {

	describe('Job Creation', function CreateJob() {
		it('should create a job', function it(done) {

			var job = new Job('email');

			var jobName = 'email_' + job.id;

			expect(job).to.have.property('name', jobName);
			expect(job).to.have.property('delay', 10);
			expect(job).to.have.property('failProb', 0);
			expect(job).to.have.property('fn');
			expect(job).to.have.property('id');
			done();
		});

		it('should be able to inject a job function', function it(done) {

			var runner = function runner() {};
			var job = new Job('test', 1000, 0.1, runner);

			var jobName = 'test_' + job.id;

			expect(job).to.have.property('name', jobName);
			expect(job).to.have.property('delay', 1000);
			expect(job).to.have.property('failProb', 0.1);
			expect(job).to.have.property('fn', runner);

			done();
		});
	});

	describe('Job Property Access', function AccessJob() {

		it('should write writeable properties', function it(done) {

			function testFn() {}

			var job = new Job();

			job.fn = testFn;
			job.delay = 5000;
			job.failProb = 0.5;

			expect(job.fn).to.equal(testFn);
			expect(job.delay).to.equal(5000);
			expect(job.failProb).to.equal(0.5);

			done();
		});

		it('should not write read-only properites', function it(done) {

			var job = new Job('test');

			expect(function () {
				job.name = 'new';
			}).to['throw'](Error);
			expect(function () {
				job.startTime = 0;
			}).to['throw'](Error);
			expect(function () {
				job.doneTime = 0;
			}).to['throw'](Error);
			expect(function () {
				job.cancelTime = 0;
			}).to['throw'](Error);
			expect(function () {
				job.runTime = 0;
			}).to['throw'](Error);
			expect(function () {
				job.id = 0;
			}).to['throw'](Error);

			done();
		});
	});

	describe('Job Execution', function RunJob() {

		it('should run a job', function it(done) {

			var job = new Job('test');

			// job start off not running
			expect(job.isRunning()).to.equal(false);

			var runPromise = job.run();

			// after .run(), it should be running
			expect(job.isRunning()).to.equal(true);

			// when done running, then it should no longer be running
			runPromise.then(function (res) {
				expect(job.isRunning()).to.equal(false);
				done(null, res);
			})['catch'](done);
		});

		it('should indicate correct running status of a job', function it(done) {

			var job = new Job('test');

			expect(job.isRunning()).to.equal(false);

			job.run();

			expect(job.isRunning()).to.equal(true);

			done();
		});

		it('should run a job with correct delay', function it(done) {

			var delay = 20;
			var job = new Job('test', delay);

			job.run().then(function (res) {
				expect(job._runTime < delay + 30).to.equal(true);
				expect(job._runTime >= delay).to.equal(true);
			}).then(function (res) {
				done(null, res);
			})['catch'](function (err) {
				done(err.message);
			});
		});

		it('should run a job with parameters passed in', function it(done) {

			var runner = function runner(a, b, c) {
				return [a, b, c];
			};

			var job = new Job('test', 10, 0, runner);
			var obj = { x: 1 };
			job.run(1, 'a', obj).then(function (res) {
				var _res = _slicedToArray(res, 3);

				var a = _res[0];
				var b = _res[1];
				var c = _res[2];

				expect(a).to.equal(1);
				expect(b).to.equal('a');
				expect(c).to.equal(obj);

				done();
			})['catch'](done);
		});
	});

	describe('Job Cancelation', function CancelJob() {

		it('should not cancel an unstarted job', function it(done) {

			var job = new Job('test', 1000);

			job.cancel(10).then(function (canceled) {
				expect(canceled).to.equal(false);
				done(canceled);
			});
		});

		it('should cancel a running job', function it(done) {

			var job = new Job('test', 1000);

			job.run().then(function (resp) {
				done('Job did not cancel but should have!');
			})['catch'](Promise.CancellationError, function (err) {
				expect(err.message).to.equal('Job canceled by user');
				expect(job.doneTime).to.be['null'];
				expect(job.cancelTime).not.to.be['null'];
				expect(job.runTime > 0).to.equal(true);
			})['catch'](done);

			job.cancel(10).then(function (canceled) {
				expect(canceled).to.equal(true);
				done(!canceled);
			});
		});

		it('should not cancel an finished job', function it(done) {

			var job = new Job('test', 10, 0, fn);

			function fn(params) {
				return Promise.resolve('FN Success');
			}

			job.run().then(function (resp) {
				expect(job.doneTime).not.to.be['null'];
				expect(job.cancelTime).to.be['null'];
				expect(job.runTime > 0).to.equal(true);
			})['catch'](Promise.CancellationError, function (err) {
				done('Job canceled, but should not have!');
			})['catch'](done);

			job.cancel(20).then(function (canceled) {
				expect(canceled).to.equal(false);
				done(canceled);
			})['catch'](done);
		});
	});
});
//# sourceMappingURL=job-mock.test.js.map
//# sourceMappingURL=job-mock.test.js.map