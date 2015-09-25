# job-mock.js

## Introduction

Sometimes you need to create a whole bunch of asynchronous tasks that can

a. run to completion
b. fail with certainty
c. fail with some probability
d. get cancelled before completion/failure

For example, you might to mock up a whole bunch of emails to test a mail queue. Or, you want  to test your promise code and you want to run it against a bunch of promise generating async tasks that may or may not fails.

This library provides a simple abstraction to perform the above.

## Example

The following will generate a job named `email` that will complete in `100ms` without fail.  On completion, it resolves to the return value of `fn`, which will be executed in the context of `job` with whatever parameters are passed to `job.run(//params)`.

    let Job = require('job-mock')
    
    let delay     = 100
      , filaProb  = 0
      , fn        = function(msg) {
                      return msg
                    }
    let job = new Job('email', delay, failProb, fn)
    
    let emailMsg = {
         from: 'JoeBlow@someemail.com',
           to: 'JanDoe@someemail.com',
      subject: 'Important message',
      message: 'Yabadabadoo!'
     }
     
     job.run(emailMsg)
        .then( console.log.bind(console) ) // 100ms later, logs emailMsg back

A job can be canceled before it completes, but only if it is already running

    let Job = require('job-mock')
    
    let delay = 1000
    let job   = new Job('email')
    
    job.run(emailMsg)
       .then( console.log.bind(console) )    // won't get here because job is not completed
       .catch( console.error.bind(console )  // [CancellationError: `Job canceled by user`]
       
    job.cancel(100)
       .then( console.log.bind(console) ) // true - indicated job was successfully cancelled
    
Trying to cancel a job that has not started or has already terminated will return `false`, but not generate any errors.

You can also cause a job to fail with a certain probability by setting `failProb`. The value `0` (default) guarantees the job will complete (assuming the function itself does not throw), and a value `1` guarantees it will fail.

	let Job = require('job')
	let emailMessages = [ { //emailMsg }, { //emailMsg } ... { // emailMsg } ] // emailMessages.length=1000
	
	let result = emailMessages.map( emailMessage => {
		return new Job('email', 10, 0.1)
					.run()
		    		.catch( (err) => return null )
	})  // `result` will have about 100 `null` values
	
## Constructor and Methods

* `constructor(name, delay, failProb, fn, errorHandler)`
* `run(params)` - return a cancellable `Promise` for return value of `job.fn(param)`, with a delay of `job.delay`
* `cancel(delay)` - cancel job's promise in `delay` ms, if it is still running and resolve to `true`, else `false` 
* `isRunning()` - returns `isPending` value of job's promise
* `display()` - returns a human friendly string representation of the job's properties
* `startLog(logFunction)` - enables debug logging with given `logFunction`
* `stopLog` - stops the logger


### Properties

###### Writeable properties

* `fn` - synchronous or `Promise` returning function that return job's main return value
* `errorHandler` - [optioal] handler to handle rejection of job's promise in its final `.catch` block - default just rethrows
* `delay` - ms delay from start to end of task execution
* `failProb` - probability that task's promise will be rejected, to simulate a failure

###### Read-only properties

* `name` - a string represation of the job, consisting of `{name}_{id}`, where `name` is provided to constructor and `id` is internally generated (and stored in `id`
* `startTime` - timestamp for when task started running
* `doneTime` - timestamp for when task completed, or `null` if failed or cancelled
* `failTime` - timestamp for when task failed, or `null` if completed or cancelled
* `cancelTime` - timestamp for when task was cancelled, or `null` if completed or failed
* `runTime` - length of time task ran before being cancelled, failing or completing
* `id` - internally generated unique 32-bit (and growing as needed in case of excessive collisions) identifier for job

## Logging and Debugging

You can pass a logging function (e.g. `Winston.info`) to `job.startLog` to start the logger, or invoke `job.stopLog()` to stop the debug logger.
