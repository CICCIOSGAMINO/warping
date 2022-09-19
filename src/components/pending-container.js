/**
 * export LitElement Mixin class for subclassing, PendingContainer
 * class is useful to handle the pending-state async tasks!
 * @param {class} base - LitElement base class
 */
export const PendingContainer = (base) =>
	class extends base {
		static get properties () {
			return {
				_hasPendingChildren: Boolean,
				_pendingCount: Number
			}
		}

		constructor () {
			super()
			// init
			this._pendingCount = 0
			// listeners
			this.addEventListener('pending-state', async event => {
				this._hasPendingChildren = true
				this._pendingCount++
				await event.detail.promise
				this._pendingCount--
				this._hasPendingChildren = this._pendingCount !== 0
			})
		}
	}