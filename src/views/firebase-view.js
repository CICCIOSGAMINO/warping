import { LitElement, html, css } from 'lit'
import { until } from 'lit/directives/until.js'
import { FirebaseController } from '../controllers/firebase-controller.js'

class FirebaseView extends LitElement {

    // Connect the FirebaseController
    fireController = new FirebaseController(this)

    static get styles () {
        return css`
            :host {
                min-width: 100%;
                min-height: 100vh;

                padding: 5rem;

                display: grid;
                align-content: center;
                justify-items: center;

                gap: 3rem;
            }
        `
    }

    render () {
        return html`
            <article>
                <h2>Firebase View</h2>
                <h3>Auth</h3>
                <p>${JSON.stringify(this.fireController.auth)}</p>

                <hr>
                <h3>Firestore</h3>
                ${JSON.stringify(this.fireController.cottonTape)}
                <hr>

                <h3>Kevlar Items</h3>
                ${this.fireController.items.map(i => html`<p>${JSON.stringify(i.data())}</p>`)}
            </article>

            <article>
                <to-delete></to-delete>

                <to-delete></to-delete>
            </article>
        `
    }
}

customElements.define('firebase-view', FirebaseView)
