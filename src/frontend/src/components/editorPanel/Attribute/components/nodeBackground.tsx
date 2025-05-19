import { keyframes, styled } from 'styled-components';

// Blob animation keyframes
const blobBounce = keyframes`
  0% {
    transform: translate(-100%, -100%) translate3d(0, 0, 0);
  }

  25% {
    transform: translate(-100%, -100%) translate3d(100%, 0, 0);
  }

  50% {
    transform: translate(-100%, -100%) translate3d(100%, 100%, 0);
  }

  75% {
    transform: translate(-100%, -100%) translate3d(0, 100%, 0);
  }

  100% {
    transform: translate(-100%, -100%) translate3d(0, 0, 0);
  }
`;

// Styled components for the animated card
export const AnimatedCard = styled.div`
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 5px 5px 10px #bebebe, -2px -2px 5px #ffffff;
`;

export const AnimatedCardNoShadow = styled.div`
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 14px;
`;

export const CardBackground = styled.div`
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(50px);
  border-radius: 14px;
  overflow: hidden;
`;

export const Blob = styled.div`
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  background-color: #00FF36;
  filter: blur(25px);
  animation: ${blobBounce} 5s infinite ease;
`; 