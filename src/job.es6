'use strict'

let Promise = require('bluebird')
let hat = require('hat')

let numBits = 32
  , base    = 16
  , expandBy = 4

let rack = hat.rack(numBits, base, expandBy)


function nop() {
}

function taskFn(params) {
	return `Job '${this.name}' executing with parameters (${params}) . . .`
}

function errorHandlerFn(error) {
	this.log(`JOB ERROR HANDLER:, ${error}`)
	throw error
}

function cancelHandler(error) {
	this.log(`JOB CANCELLATION HANDLER: ${error}`)
	this._cancelTime = Date.now()
	this._doneTime = null
	this._runTime = this._cancelTime - this._startTime
	throw error
}

class Job {
	constructor(name, delay, failProb, taskHandler, errorHandler) {

		let id = rack();

		// Writeable
		this._fn       			= typeof taskHandler === 'function' ? taskHandler : taskFn
		this._errorHandler 	= (typeof errorHandler === 'function' ? errorHandler :errorHandlerFn).bind(this)
		this._delay    			= delay || 10
		this._failProb 			= failProb || 0

		// ReadOnly
		this._name     			= `${name||'job'}_${id}`
		this._startTime 		= null
		this._cancelTime 		= null
		this._doneTime 			= null
		this._failTime 			= null
		this._runTime 			= null
		this._id 						= id

		// Private
		this._cancelHandler = cancelHandler.bind(this)
		this._runPromise 		= Promise.resolve(null)
		this._delayPromise  = Promise.resolve(null)
		this._logger        = nop
		this._debug         = false

	}

	/***
	 Instance methods
	 ***/
	run(...params) {

		this._startTime = Date.now()
		this._cancelTime = this._doneTime = null

		this.log(`Starting 'run' task`)
		this._runPromise =  Promise
			.delay( this.fn.apply(this, params), this.delay)
			.cancellable()
		 	.catch( Promise.CancellationError,  this._cancelHandler )
			.then(res => {
				this.log(`Task ran. Decide on fulfill/reject based on 'failProb'`)
				if (this.failProb > 0 && Math.random() < this.failProb) {
					this._failTime = Date.now()
					this._runTime = this._failTime - this._startTime
					this.log(`Rejecting task: ${this.display()}`)
					return Promise.reject(`Job ${this.name} failed!`)
				}
				else {
					this._doneTime = Date.now()
					this._runTime = this._doneTime - this._startTime
					this.log(`Fulfilling task: ${this.display()}`)
					return res;
				}
			})
			.catch( this._errorHandler )

		return this._runPromise
	}


	cancel(delay) {

		delay = isNaN( +delay ) ? 0 : delay
		this.log(`Will attempt to cancel job in ${delay}ms`)

		return Promise
				.delay(delay)
				.then( () => {
						if (!this.isRunning()) return Promise.resolve(false)
					  this.log(`Task still running, being cancelled...`)
						return this._runPromise
								.cancel( new Promise.CancellationError( 'Job canceled by user' ) )
								.catch( (err) => true )
				})

	}

	isRunning() {
		return this._runPromise.isPending()
	}

	display() {
		let str = `
  Displaying Job ${this.name}:
      name       : ${this.name}
      id         : ${this._id}
      startTime  : ${this._startTime}
      doneTime   : ${this._doneTime}
      cancelTime : ${this._cancelTime}
      failTime   : ${this._failTime}
      runTime    : ${this._runTime}
      delay      : ${this.delay}
`
		return str
	}

	startLog(logFn) {
		if (typeof logFn !== 'function') return err(`Must set Job logger to a Function`)
		this._logger = function(logMsg) {
			return logFn( `${Date.now()} (JOB[${this.id}]): ${logMsg}`)
		}
		this.log(`Turning logging on`)
		return this
	}

	stopLog() {
		this.log(`Turning logging off`)
		this._logger = nop
		return this
	}

	log(msg) {
		return this._logger(msg)
	}

	/**
	 Instance property getter / setters
	 **/
  // Read/Write properties
	get fn() {
		return this._fn
	}

	set fn(f) {
		if (typeof f !== 'function') return err(`Must set Job run task to a Function`)
		this._fn = f
	}

	get errorHandler() {
		return this._errorHandler
	}

	set errorHandler(fn) {
		if (typeof fn !== 'function') return err(`Must set Job error handler to a Function`)
		this._errorHandler = fn
	}

	get delay() {
		return this._delay
	}

	set delay(del) {
		if (isNaN(+del)) return err(`Cannot change delay of a running Job`)
		this._delay = del
	}

	get failProb() {
		return this._failProb
	}

	set failProb(p) {
		if (isNaN(+p)) return err(`Must set Job failure probability to a Number`)
		this._failProb = p
	}


	// Read only properties
	get name() {
		return this._name
	}

	get startTime() {
		return this._startTime
	}

	get doneTime() {
		return this._doneTime
	}

	get failTime() {
		return this._failTime
	}

	get cancelTime() {
		return this._cancelTime
	}

	get runTime() {
		return this._runTime
	}

	get id() {
		return this._id
	}

}

module.exports = Job