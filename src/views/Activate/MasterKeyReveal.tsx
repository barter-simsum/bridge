import React, { useCallback, useEffect, useMemo, useState } from 'react';

import ActivateView from './ActivateView';
import ActivateHeader from './ActivateHeader';
import { MasterKey } from './MasterKey';
import { Box, Button, Icon } from '@tlon/indigo-react';
import ActivateParagraph from './ActivateParagraph';
import { ActivateSteps } from './ActivateSteps';
import { useActivateFlow } from './ActivateFlow';
import { timeout } from 'lib/timeout';
import { useLocalRouter } from 'lib/LocalRouter';

const MasterKeyReveal = () => {
  const { isFaded, setIsFaded } = useActivateFlow();
  const { push, names } = useLocalRouter();

  const goToDownload = useCallback(() => {
    push(names.DOWNLOAD);
  }, [names.DOWNLOAD, push]);

  const onRevealClick = useCallback(async () => {
    setIsFaded(false);
    await timeout(500); // Pause for UI fade animation
    goToDownload();
  }, [goToDownload, setIsFaded]);

  const header = useMemo(() => {
    return (
      <Box className={isFaded ? 'faded-in' : 'faded-out'}>
        <ActivateHeader copy={'Here is your Master Key.'} />
        <ActivateParagraph
          copy={
            "Your Master Key is your 4-word password for your Urbit. Make sure you're in a private place before you reveal it."
          }
        />
      </Box>
    );
  }, [isFaded]);

  const footer = useMemo(() => {
    return (
      <Box
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        height={'100%'}
        className={isFaded ? 'faded-in' : 'faded-out'}
        justifyContent="flex-end">
        <Button
          onClick={onRevealClick}
          backgroundColor="black"
          color={'white'}
          padding={'16px'}
          fontFamily="Inter"
          height={'50px'}
          fontWeight={'400'}
          fontSize={'18px'}>
          <Icon
            display="inline-block"
            icon="Visible"
            size="18px"
            color={'white'}
          />
          &nbsp; Reveal
        </Button>
      </Box>
    );
  }, [isFaded, onRevealClick]);

  const onViewTransition = useCallback(async () => {
    await timeout(500); // Pause for UI fade animation
    setIsFaded(true);
    await timeout(500); // Pause for UI fade animation
  }, [setIsFaded]);

  useEffect(() => {
    // Fade in content
    onViewTransition();
  }, [onViewTransition]);

  return (
    <>
      <ActivateView header={header} footer={footer}>
        <Box
          alignItems={'center'}
          display={'flex'}
          flexDirection={'column'}
          flexWrap={'nowrap'}
          height={'100%'}
          justifyContent={'center'}>
          <Box
            display={'flex'}
            flexDirection={'row'}
            flexWrap={'nowrap'}
            width={'80%'}
            height={'min-content'}
            justifyContent={'center'}>
            <MasterKey paused={true} />
          </Box>
        </Box>
      </ActivateView>
      <ActivateSteps
        currentStep={0}
        totalSteps={4}
        className={isFaded ? 'faded-in' : 'faded-out'}
      />
    </>
  );
};

export default MasterKeyReveal;
