import { Button, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  monospacedDigit,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { LockScreenProps } from '@/domain/lockScreen';

/** The button's id in the interaction events. */
export const VALIDATE_TARGET = 'validate';

/**
 * The running session on the lock screen and in the Dynamic Island.
 * Runs in the widget extension: no hooks, nothing from outside this function (colours included).
 */
const WorkoutActivity = (props: LockScreenProps, environment: LiveActivityEnvironment) => {
  'widget';
  const coral = '#FF6B4A';
  const muted = environment.colorScheme === 'dark' ? '#B5A99F' : '#6B5F57';
  const resting = props.restStart !== null && props.restEnd !== null;
  const rest = resting ? { lower: new Date(props.restStart!), upper: new Date(props.restEnd!) } : null;

  const validate = props.canValidate ? (
    <Button
      label="Valider"
      systemImage="checkmark"
      target="validate"
      modifiers={[buttonStyle('borderedProminent'), controlSize('large'), tint(coral)]}
    />
  ) : null;

  return {
    banner: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 16 })]}>
        <HStack>
          <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(muted)]}>
            {props.done ? props.session : `${props.exercise} · ${props.setLabel}`}
          </Text>
          <Spacer />
          {rest ? (
            <Text
              timerInterval={rest}
              countsDown
              modifiers={[font({ size: 15, weight: 'bold' }), monospacedDigit(), foregroundStyle(coral)]}
            />
          ) : null}
        </HStack>
        <HStack spacing={12}>
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 26, weight: 'heavy', design: 'rounded' })]}>
              {props.done ? props.exercise : props.target}
            </Text>
            {props.plates || props.done ? (
              <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(muted)]}>
                {props.done ? props.target : props.plates}
              </Text>
            ) : null}
          </VStack>
          <Spacer />
          {validate}
        </HStack>
        {rest ? <ProgressView timerInterval={rest} countsDown modifiers={[tint(coral)]} /> : null}
      </VStack>
    ),
    compactLeading: <Image systemName="dumbbell.fill" color={coral} />,
    compactTrailing: rest ? (
      <Text timerInterval={rest} countsDown modifiers={[monospacedDigit(), foregroundStyle(coral)]} />
    ) : (
      <Text modifiers={[font({ weight: 'semibold' })]}>{props.setLabel}</Text>
    ),
    minimal: <Image systemName="dumbbell.fill" color={coral} />,
    expandedLeading: (
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(muted)]}>{props.setLabel}</Text>
    ),
    expandedTrailing: rest ? (
      <Text
        timerInterval={rest}
        countsDown
        modifiers={[font({ size: 15, weight: 'bold' }), monospacedDigit(), foregroundStyle(coral)]}
      />
    ) : null,
    expandedCenter: <Text modifiers={[font({ size: 15, weight: 'bold' })]}>{props.exercise}</Text>,
    expandedBottom: (
      <HStack spacing={12} modifiers={[padding({ horizontal: 8 })]}>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({ size: 22, weight: 'heavy', design: 'rounded' })]}>{props.target}</Text>
          {props.plates ? (
            <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(muted)]}>{props.plates}</Text>
          ) : null}
        </VStack>
        <Spacer />
        {validate}
      </HStack>
    ),
  };
};

export default createLiveActivity('WorkoutActivity', WorkoutActivity);
