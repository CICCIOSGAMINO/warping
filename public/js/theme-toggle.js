// check for the user preference in local storage and fallback to
// check the system preference if nothing is found in storage
const storageKey = 'theme-preference'

const getColorPreference = () => {
	if (localStorage.getItem(storageKey)) {
		return localStorage.getItem(storageKey)
	} else {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark' : 'light'
	}
}

const setPreference = () => {
	localStorage.setItem(storageKey, theme.value)
	reflectPreference()
}

const theme = {
	value: getColorPreference()
}


/**
 * An important thing to note at this point is the HTML document parsing state.
 * The browser doesn't know about the "#theme-toggle" button yet, as the <head>
 * tag hasn't been completely parsed. However, the browser does have a
 * document.firstElementChild , aka the <html> tag. The function attempts to set
 * both to keep them in sync, but on first run will only be able to set the HTML
 * tag. The querySelector won't find anything at first and the optional chaining
 * operator ensures no syntax errors when it's not found and the setAttribute
 * function is attempted to be invoked.
 */
const reflectPreference = () => {
	console.log(`@DATA-THEME >> ${theme.value}`)
	// working tod level reference
	document.firstElementChild
		.setAttribute('data-theme', theme.value)

	document.querySelector('#theme-toggle')
		?.setAttribute('aria-label', theme.value)

	document.querySelector('#theme-toggle')
		?.setAttribute('data-theme', theme.value)

	document.querySelector('.sun-and-moon')
		?.setAttribute('data-theme', theme.value)
		
	// set the data-theme attribute where you need
	document.querySelector('app-lite')
		?.setAttribute('data-theme', theme.value)
}

// set early so no page flashes / CSS is made aware
reflectPreference()

/** 
 * The button still needs the attribute, so wait for the page load event,
 * then it will be safe to query, add listeners and set attributes on:
 */
window.addEventListener('DOMContentLoaded', () => {
	// set on load so screen readers can get the latest value on the button
	reflectPreference()
	
	// now this script can find and listen for clicks on the control
	document.querySelector('#theme-toggle')
		.addEventListener('click', () => {
			theme.value = theme.value === 'light'
				? 'dark' : 'light'
			
			setPreference()
		})
})

/**
 * Synchronizing with the system	
 * Unique to this theme switch is synchronization with the system preference
 * as it changes. If a user changes their system preference while a page and
 * this component are visible, the theme switch will change to match the new
 * user preference, as if the user had interacted with the theme switch at
 * the same time it did the system switch.
 */
window.matchMedia('(prefers-color-scheme: dark)')
	.addEventListener('change', ({matches: isDark}) => {
		theme.value = isDark ? 'dark' : 'light'
		setPreference()
	})