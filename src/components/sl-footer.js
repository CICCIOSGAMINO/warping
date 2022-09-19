// sl-footer (Footer page)
import { html, css, LitElement } from 'lit'
import { sharedStyles } from '../styles/shared-styles.js'

import {
    liteLogo,
    instagramSVG,
    youtubeSVG,
    twitterSVG,
    whatsappSVG,
} from './imagesSVG'

import {
    newsletterStorageKey,
    newsletterEndpoint
} from '../utils/constants.js'

let removeCount = 0

class SlFooter extends LitElement {
	static get styles () {
	    return [
		    sharedStyles,
			css`
                :host {
                    padding-top: 3rem;
                    padding-bottom: 13rem;
                    min-width: 100%;

                    display: grid;
                    align-content: center;
                    justify-items: center;
                    align-items: flex-start;
                    gap: 1rem;
                    position: relative;
                }

                p {
                    font-size: 1.7rem;
                }

                details {
                    width: 21rem;
                }

                details > summary {
                    cursor: pointer;
                    /* border-bottom: 1px solid var(--text1);
                    line-height: 7rem; */
                }

                details[open] summary ~ * {
                    animation: open 0.3s ease-in-out;
                }
                
                details[open] > p {

                }

                summary:hover {
                    color: var(--brand);
                }

                #copy {
                    width: 100%;
                    position: absolute;
                    bottom: 3rem;
                }

                #copy > p {
                    font-size: 1.5rem;
                    text-align: center;
                }

                #dev {
                    width: 100%;
                    position: absolute;
                    bottom: 1rem;
                }

                #dev > p {
                    font-size: 1rem;
                    text-align: center;
                }

                a {
                    color: var(--text1);
                    text-decoration: none;
                    /* text-transform: uppercase; */
                }

                /* a:visited, a:hover, a:active, a:focus { */
                a:hover, a:active, a:focus {
                    color: var(--brand);
                }

                ul {
                    padding-left: 1rem;
                    list-style: none;
                }

                li {
                    padding: .5rem;
                }

                li > a {
                    font-size: 1.7rem;
                    line-height: 2rem;
                }

                li::before {
                    /* content: "😀 " */
                }

                li > svg {
                    margin-inline-end: 0.5rem;
                    width: 2.1rem;
                    vertical-align: middle;
                    display: inline-block;
                }

                .socials {
                    padding: 0.3rem;
                    display: inline-block;
                }

                .socials > svg {
                    width: 3.3rem;
                    fill: var(--text1);
                }

                svg {
                    width: 14.1rem;
                }

                /* newsletter */
                form {
                    position: relative;
                }

                /* input[type="email"] { */
                input {
                    margin-left: 0.5rem;
                    padding-block-start: 0.5rem;
                    padding-block-end: 0.5rem;
                    padding-inline-start: 0.5rem;
                    padding-inline-end: 0.5rem;

                    width: 161px;

                    background: none;
                    border: none;
                    border-bottom: 0.5px solid var(--brand);
                }

                input:focus:valid {
                    border-bottom: 1px solid var(--custom-green);
                }

                input:focus:invalid {
                    border-bottom: 1px solid var(--custom-red);
                }

                input:focus {
                    outline: none;
                }

                input[type="email"] {
                    margin-top: 1.5rem;
                    margin-bottom: 2.7rem;
                }

                #join {
                    display: inline-block;
                    position: absolute;
                    top: 8rem;
                    left: 0;

                    z-index: 10;
                }

                #join[sent] {
                    animation-name: submit-btn;
                    animation-duration: 0.5s;
                    animation-timing-function: ease-out;
                    animation-iteration-count: 1;
                    animation-fill-mode: forwards;
                }

                #join > svg {
                    width: 27px;
                    height: 27px;

                    fill: var(--text1);
                }

                #check {
                    opacity: 0;
                    visibility: hidden;

                    display: inline-block;
                    position: absolute;
                    top: 8rem;
                    left: 0;
                }

                #check[sent] {
                    animation-name: check-btn;
                    animation-duration: 0.5s;
                    animation-timing-function: ease-out;
                    animation-iteration-count: 1;
                    animation-fill-mode: forwards;
                }

                #check > svg {
                    width: 25px;
                    height: 25px;

                    fill: var(--custom-green);
                }

                #check[warning] > svg {
                    fill: hsl(60, 100%, 47%);
                }

                /* Desktop */
                @media (min-width: 640px) {
                    :host {
                        grid-template-columns: 1fr 1fr 1fr;
                    }
                }

                @keyframes open {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                @keyframes submit-btn {
                    0% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(150px);
                        opacity: 0;
                    }
                }

                @keyframes check-btn {
                    0% {
                        opacity: 0;
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(150px);
                    }
                }
    `]
	}

    connectedCallback () {
		super.connectedCallback()
		// match the media query
		window.matchMedia('(min-width: 640px)')
			.addEventListener('change', this.#handleResizeToDesktop)
		window.matchMedia('(max-width: 639px)')
			.addEventListener('change', this.#handleResizeToMobile)
    }

    firstUpdated () {
        if (window.innerWidth >= 640) {
            this.renderRoot.querySelectorAll('details')
                .forEach((e) => {
                    e.setAttribute('open', '')
                })
        }

        // handle newsletter UI
        if (localStorage.getItem(newsletterStorageKey)) {
            this.newsletter = localStorage.getItem(newsletterStorageKey)
            this.okCheckNewsletter()
        }

        // listening form submit
        this.renderRoot.querySelector('#newsletter-form')
            .addEventListener('submit', this.#handleSubmit)

        this.renderRoot.querySelector('#join')
            .addEventListener('click', this.#handleSubmit)
    }

    okCheckNewsletter () {

        const { email, nik } =
            JSON.parse(localStorage.getItem(newsletterStorageKey))

        this.renderRoot.querySelector('input[type="email"]')
            .value = email

        this.renderRoot.querySelector('input[type="text"]')
            .value = nik

        this.renderRoot.querySelector('#check')
            .style.visibility = 'visible'

        this.renderRoot.querySelector('#join')
            .setAttribute('sent', '')

        this.renderRoot.querySelector('#join')
            .style.visibility = 'hidden'

        this.renderRoot.querySelector('#check')
            .setAttribute('sent', '')

    }

    #handleResizeToDesktop = (e) => {
		if (e.matches) {
			this.mobileLayout = false
			console.log(`@DESKTOP >> ${!this.mobileLayout}`)
            
            this.renderRoot.querySelectorAll('details')
                .forEach((e) => {
                    e.setAttribute('open', '')
                })
		}
	}

	#handleResizeToMobile = (e) => {
		if (e.matches) {
			this.mobileLayout = true
            console.log(`@MOBILE >> ${this.mobileLayout}`)

            this.renderRoot.querySelectorAll('details')
                .forEach((e) => {
                    e.removeAttribute('open')
                })
		}
	}

    #handleSubmit = async (e) => {
        e.preventDefault()

        const form =
            this.renderRoot.querySelector('form')
        const inputEmail =
            this.renderRoot.querySelector('input[type="email"]')
        const inputNik =
            this.renderRoot.querySelector('input[type="text"]')
        
        if (!form.checkValidity() || this.newsletter) {
            return
        }

        const newsletterObj = {
            email: inputEmail.value,
            nik: inputNik.value
        }

        localStorage.setItem(
            newsletterStorageKey,
            JSON.stringify(newsletterObj))

        this.okCheckNewsletter()
        console.log('@CACHE >> ', newsletterObj)

        // fetch the endpoint to webhook the newsletter nik / email
        this.#fetchNewsletter(
            inputNik.value,
            inputEmail.value)
    }

    #fetchNewsletter = async (nik, email) => {
        const urlWithSearchParams =
            `${newsletterEndpoint}/?nik=${nik}&email=${email}`
            
        const response = await fetch(
            urlWithSearchParams,
            {
                method: 'GET',
                mode: 'cors'
            }
        )

        // @DEBUG
        console.log(response)
    }

	render () {
		return html`
            <details>
                <summary>Customer Care</summary>
                <ul>
                    <li><a href="/contacts">🗨 &nbsp;Contact / Contatti</a></li>
                    <li><a href="#">📦 &nbsp;Returns / Resi</a></li>
                    <li><a href="#">🚀 &nbsp;Ship / Spedizioni</a></li>
                    <li><a href="#">👔 &nbsp;Size / Misure</a></li>
                </ul>
            </details>

            <details>
                <summary>Social / Link</summary>
                <ul>
                    <li>

                        <a
                            aria-label="Whatsapp link"
                            class="socials"
                            target="_blank"
                            href="https://www.instagram.com/slabbed.it/">
                            ${whatsappSVG}
                        </a>

                        <a
                            aria-label="Instagram link"
                            class="socials"
                            target="_blank"
                            href="https://www.instagram.com/slabbed.it/">
                            ${instagramSVG}
                        </a>

                        <a  aria-label="Youtube link"
                            class="socials"
                            target="_blank"
                            href="https://www.youtube.com/channel/">
                            ${youtubeSVG}
                        </a>

                        <a
                            id="first-social"
                            aria-label="Twitter link"
                            class="socials"
                            target="_blank"
                            href="https://www.twitter.com/slabbed/">
                            ${twitterSVG}
                        </a>

                    </li>
                </ul>
            </details>

            <details>
                <summary>Newsletter</summary>
                <ul>
                    <li>

                        <p>
                            🪤 &nbsp;Join the Newsletter
                        </p>

                        <form
                            id="newsletter-form"
                            name="newsletterForm">

                            <input
                                id="nik"
                                type="text"
                                size="25"
                                placeholder="nickname"
                                required />

                            <input
                                id="email"
                                type="email"
                                size="25"
                                placeholder="email"
                                required />

                            <button
                                id="join"
                                aria-label="Join Newsletter"
                                title="Join Newsletter"
                                type="submit">
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" tabindex="0" viewBox="0 0 48 48">
                                    <path d="M24 31.3 31.3 24 24 16.7 21.9 18.8 25.6 22.5H16.5V25.5H25.6L21.9 29.2ZM24 44Q19.75 44 16.1 42.475Q12.45 40.95 9.75 38.25Q7.05 35.55 5.525 31.9Q4 28.25 4 24Q4 19.8 5.525 16.15Q7.05 12.5 9.75 9.8Q12.45 7.1 16.1 5.55Q19.75 4 24 4Q28.2 4 31.85 5.55Q35.5 7.1 38.2 9.8Q40.9 12.5 42.45 16.15Q44 19.8 44 24Q44 28.25 42.45 31.9Q40.9 35.55 38.2 38.25Q35.5 40.95 31.85 42.475Q28.2 44 24 44ZM24 41Q31.25 41 36.125 36.125Q41 31.25 41 24Q41 16.75 36.125 11.875Q31.25 7 24 7Q16.75 7 11.875 11.875Q7 16.75 7 24Q7 31.25 11.875 36.125Q16.75 41 24 41ZM24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Z"/>
                                </svg>
                            </button>

                            <div
                                id="check"
                                title="Active" >
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" tabindex="0" viewBox="0 0 48 48">
                                    <path d="M38.5 39.5V33.5H32.5V30.5H38.5V24.5H41.5V30.5H47.5V33.5H41.5V39.5ZM24 44Q19.75 44 16.1 42.475Q12.45 40.95 9.75 38.25Q7.05 35.55 5.525 31.9Q4 28.25 4 24Q4 19.8 5.525 16.15Q7.05 12.5 9.75 9.8Q12.45 7.1 16.1 5.55Q19.75 4 24 4Q27.75 4 31 5.2Q34.25 6.4 36.85 8.5L34.7 10.65Q32.5 8.9 29.8 7.95Q27.1 7 24 7Q16.75 7 11.875 11.875Q7 16.75 7 24Q7 31.25 11.875 36.125Q16.75 41 24 41Q25.85 41 27.575 40.65Q29.3 40.3 30.9 39.6L33.15 41.9Q31.1 42.9 28.8 43.45Q26.5 44 24 44ZM21.05 33.1 12.8 24.8 15.05 22.55 21.05 28.55 41.75 7.85 44.05 10.1Z"/>
                                </svg>
                            </div>

                        </form>

                    </li>

                </ul>
            </details>

            <details>
                <summary>Privacy / Cookies</summary>
                <ul>
                    <li><a href="/gdpr">🍪 &nbsp;GDPR / Cookies</a></li>
                    <li><a href="/dta">🍱 &nbsp;My Data</a></li>
                </ul>
            </details>

            <details>
                <summary>Slabbed</summary>
                <a href="/logo">
                    ${liteLogo}
                </a>
            </details>

            <div id="copy">
                <p>Copyright ©2022 Slabbed.it - All rights reserved - VAT 00990322322</p>
            </div>

            <div id="dev">
                <p>Made  with <s>love</s> a keyboard <mark>🧑‍💻</mark> by
                    <a href="https://github.com/CICCIOSGAMINO"
                        aria-label="Cicciosgamino"
                        target="_blank"
                        rel="noopener">
                    @cicciosgamino
                    </a>
                </p>
    </div>
    `
	}
}

customElements.define('sl-footer', SlFooter)