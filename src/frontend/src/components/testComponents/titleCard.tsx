import React from 'react';
import styled from 'styled-components';

export default function TitleCard() {
  return (
    <StyledWrapper>
      <div className="card" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
   width: 100%;
   height: 6vh;
   border-radius: 5px;
   background: #FD5E0F;
   box-shadow: 20px 20px 60px #bebebe,
                 -20px -20px 60px #ffffff;
  }`;

