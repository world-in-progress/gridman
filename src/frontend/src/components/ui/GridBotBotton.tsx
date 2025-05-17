import React from 'react';
import styled from 'styled-components';
import { Bot } from 'lucide-react';

export default function GridBotBotton() {
    return (
        <StyledWrapper>
            <button className="button" data-text="Awesome">
                <span className="actual-text">&nbsp;GridBot&nbsp;</span>
                <span aria-hidden="true" className="hover-text">
                    &nbsp;GridBot&nbsp;
                </span>
            </button>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
    /* === removing default button style ===*/
    .button {
        margin: 0;
        height: auto;
        background: transparent;
        padding: 0;
        border: none;
        cursor: pointer;
    }

    /* button styling */
    .button {
        --border-right: 6px;
        --text-color: #ffffff;
        --animation-color: #71f6ff;
        --fs-size: 3rem;
        letter-spacing: 3px;
        text-decoration: none;
        font-size: var(--fs-size);
        font-family: 'Arial';
        position: relative;
        text-transform: uppercase;
        color: var(--text-color);
        font-weight: bold;
    }
    /* this is the text, when you hover on button */
    .hover-text {
        position: absolute;
        box-sizing: border-box;
        content: attr(data-text);
        color: var(--animation-color);
        width: 0%;
        inset: 0;
        border-right: var(--border-right) solid var(--animation-color);
        overflow: hidden;
        transition: 0.5s;
        font-weight: bold;
    }
    /* hover */
    .button:hover .hover-text {
        width: 100%;
        filter: drop-shadow(0 0 23px var(--animation-color));
    }
`;
