// (Home Page)
import { html, css, LitElement } from 'lit'
import { tapeCover } from '../components/imagesSVG.js'
import { sharedStyles } from '../styles/shared-styles.js'

import '../components/sl-footer.js'

class HomeView extends LitElement {
	static get styles () {
		return [
			sharedStyles,
			css`
				:host {
					z-index: -1;
					display: grid;
					justify-items: center;
					align-items: center;
					gap: 0;
				}

				svg {
					width: min(50vw, 500px);
				}

				img {
					width: 100%;
				}
    	`]
	}

	static get properties () {
		return {
			_pendingCount: Number,
			_hasPendingChildren: Boolean
		}
	}

	_handleClick () {
		console.log('@HANDLE >> CLICK')
		const p = new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve('')
			}, 5000)
		})
		const pendingStateEvent = new CustomEvent('pending-state', {
			bubbles: true,
			composed: true,
			detail: {
				promise: p
			}
		})

		this.dispatchEvent(pendingStateEvent)
	}

	// read the data-page attribute to go
	navToPage (e) {
		const page = e.target.dataset.page
		console.log(`@PAGE >> ${page}`)
		// use the global Vaadin Router
		window.Router.go(`/${page}`)
	}

	render () {
		return html`
			<!-- Section -->
			<section class="light">
				<img src="images/team/liuk/liuk_orobia_a001.jpg" alt="Liuk Regione Lombardia">
			</section>

			<!-- Section -->
			<section class="dark">
				${tapeCover}
			</section>

			<!-- Footer -->
			<sl-footer></sl-footer>
    `
	}
}

customElements.define('home-view', HomeView)
