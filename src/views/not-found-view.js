// view-notfound (Not Found page)
import { html, css, LitElement } from 'lit'
import { sharedStyles } from '../styles/shared-styles.js'

class NotFoundView extends LitElement {
	static get styles () {
		return [
			sharedStyles,
			css`
      :host {
        min-width: 100%;
				min-height: 100vh;

        display: grid;
        align-content: center;
			  justify-items: center;
				align-items: center;
        gap: 1rem;

        /* text-align: center; */

        background-color: var(--brand);
      }

      svg {
        width: 171px;
        height: 171px;
        fill: var(--text1);
      }
    `]
	}

	render () {
		return html`
      <!-- <h1>☹️</h1> -->
      <svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path d="m539.9947 20.148751c-286.65066 0-519.845439 233.194789-519.845439 519.846439 0 286.65118 233.194779 519.85601 519.845439 519.85601 286.65117 0 519.856-233.20483 519.856-519.85601 0-286.65165-233.20483-519.846439-519.856-519.846439zm0 76.953396c245.06271 0 442.90269 197.830043 442.90269 442.893043 0 245.06252-197.83998 442.90273-442.90269 442.90273-245.06209 0-442.89211-197.84021-442.89211-442.90273 0-245.063 197.83002-442.893043 442.89211-442.893043zm-166.54187 205.810113a78.640066 78.640066 0 0 0-78.64624 78.63685 78.640066 78.640066 0 0 0 78.64624 78.64708 78.640066 78.640066 0 0 0 78.63675-78.64708 78.640066 78.640066 0 0 0-78.63675-78.63685zm333.11381 0a78.640066 78.640066 0 0 0-78.64666 78.63685 78.640066 78.640066 0 0 0 78.64666 78.64708 78.640066 78.640066 0 0 0 78.63677-78.64708 78.640066 78.640066 0 0 0-78.63677-78.63685zm-166.54185 309.6476c-123.21365 0-231.50716 65.79855-291.53052 164.06696 19.29503 16.85908 40.05316 32.08069 62.09359 45.4205 45.52997-79.33016 131.04616-132.53413 229.43693-132.53413 98.38566 0 183.87618 53.20046 229.39706 132.52405 22.03635-13.33807 42.80205-28.55423 62.09377-45.41042-60.01244-98.26818-168.27746-164.06696-291.49083-164.06696z" stroke-linecap="square" style="-inkscape-stroke:none"/>
        </g>
      </svg>

      <h2>404 Error</h2>
      <h3>Page Not Found!</h3>
    `
	}
}

customElements.define('not-found-view', NotFoundView)
