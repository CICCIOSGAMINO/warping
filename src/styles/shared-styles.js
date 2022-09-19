import { css } from 'lit'

export const sharedStyles = css`

  h1, h2, h3, p, figure {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1 {
    margin: 0;
    padding: 0;
    font-size: 4.7rem;
    font-weight: 500;
    color: var(--text1);
  }

  .dark {
    background-color: var(--text1);
    color: var(--surface1);
  }

  .light {
    background-color: var(--surface1);
    color: var(--text1);
  }

  /* clear default button style */
  button {
    border: none;
    background: none;
    color: inherit;
    outline: inherit;
    line-height: 0;
    
    cursor: pointer;
  }

  button:disabled {
    color: whitesmoke;
    background-color: #333;
  }

  button:hover:disabled {
    color: whitesmoke;
    background-color: #333;
  }

  .btn-default {
    margin: 1rem;
    padding: 3rem;
    border: 2px solid var(--brand);
    border-radius: 1rem;
  }

  .btn-default:hover {
    color: whitesmoke;
    background-color: var(--brand);
  }
  
  svg {
    display: inline-block;
    outline: none;
  }

  /* ---------------------------- Mobile media ----------------------------- */
  @media (max-width: 640px) {

  }
`