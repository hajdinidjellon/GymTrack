import { Button, HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  background,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  font,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  padding,
  shapes,
  strokeBorder,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import type { ReactElement } from 'react';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';
import type { LockScreenProps } from '@/domain/lockScreen';

/** The button's id in the interaction events. */
export const VALIDATE_TARGET = 'validate';

/**
 * The running session on the lock screen and in the Dynamic Island, in the
 * app's "Autocollant" style: paper, ink outlines, coral action, sun rest, IWF plates.
 * Runs in the widget extension: no hooks, nothing from outside this function (colours included).
 */
const WorkoutActivity = (props: LockScreenProps, environment: LiveActivityEnvironment) => {
  'widget';
  const paper = '#FFF6EC';
  const ink = '#1F1A17';
  const muted = '#6B5F57';
  const coral = '#FF6B4A';
  const coralSoft = '#FFE0D4';
  const sunSoft = '#FFF1BF';
  const successSoft = '#DDF5E7';
  // Always-on display: the system dims everything, the outlines are enough
  const dim = environment.isLuminanceReduced === true;
  // Dynamic Island: always black behind, so light text
  const island = '#FFFFFF';
  const islandMuted = '#B5A99F';

  const resting = props.restStart !== null && props.restEnd !== null;
  const rest = resting ? { lower: new Date(props.restStart!), upper: new Date(props.restEnd!) } : null;
  const progress = props.setsTotal > 0 ? Math.min(1, props.setsDone / props.setsTotal) : 0;

  const plateFill = (kg: number) =>
    kg === 25 || kg === 2.5
      ? '#E5484D'
      : kg === 20
        ? '#3D7BF4'
        : kg === 15
          ? '#FFD23F'
          : kg === 10
            ? '#4CC38A'
            : kg === 5
              ? '#FFFFFF'
              : '#C9CFD4';
  const plateText = (kg: number) => (kg === 25 || kg === 20 || kg === 2.5 ? '#FFFFFF' : ink);

  /**
   * A sticker block: filled rounded shape, ink outline. strokeBorder is a
   * modifier that draws the outline over the view it is on: on a bare shape
   * laid on top, that shape fills in black and hides the text.
   */
  const sticker = (content: ReactElement, fill: string, radius: number, line = 2.5) => (
    <VStack
      modifiers={[
        background(fill, shapes.roundedRectangle({ cornerRadius: radius })),
        strokeBorder({
          content: ink,
          style: { lineWidth: dim ? 1.5 : line },
          shape: 'roundedRectangle',
          cornerRadius: radius,
        }),
      ]}
    >
      {content}
    </VStack>
  );

  /** Plates of one side, as coloured discs like in the app. */
  const plates =
    props.plateList.length > 0 ? (
      <HStack spacing={4}>
        {props.plateList.map(({ kg, label }, i) => (
          <Text
            key={`${kg}-${i}`}
            modifiers={[
              font({ size: 13, weight: 'heavy', design: 'rounded' }),
              monospacedDigit(),
              foregroundStyle(plateText(kg)),
              padding({ horizontal: 8, vertical: 3 }),
              background(plateFill(kg), shapes.capsule()),
              strokeBorder({ content: ink, style: { lineWidth: 1.5 }, shape: 'capsule' }),
            ]}
          >
            {label}
          </Text>
        ))}
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(muted)]}>{props.labels.perSide}</Text>
      </HStack>
    ) : props.plates ? (
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(muted), lineLimit(1)]}>
        {props.plates}
      </Text>
    ) : null;

  const validateButton = (size: 'regular' | 'large') =>
    props.canValidate ? (
      <Button
        label={props.labels.validate}
        systemImage="checkmark"
        target="validate"
        modifiers={[buttonStyle('borderedProminent'), buttonBorderShape('capsule'), controlSize(size), tint(coral)]}
      />
    ) : null;
  const validate = validateButton('large');

  /** "Série 2/4" pill, the exercise, and the session progress: one line. */
  const header = (
    <HStack spacing={8}>
      {sticker(
        <Text
          modifiers={[
            font({ size: 13, weight: 'heavy', design: 'rounded' }),
            foregroundStyle(ink),
            lineLimit(1),
            padding({ horizontal: 10, vertical: 4 }),
          ]}
        >
          {props.done || !props.setLabel ? props.session : props.setLabel}
        </Text>,
        props.done ? successSoft : coralSoft,
        12,
        2,
      )}
      {props.done ? null : (
        <Text
          modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(ink), lineLimit(1), minimumScaleFactor(0.8)]}
        >
          {props.exercise}
        </Text>
      )}
      <Spacer />
      <Text
        modifiers={[font({ size: 13, weight: 'bold', design: 'rounded' }), monospacedDigit(), foregroundStyle(muted)]}
      >
        {`${props.setsDone}/${props.setsTotal}`}
      </Text>
    </HStack>
  );

  const bar = <ProgressView value={progress} modifiers={[tint(props.done ? '#5FD39A' : coral)]} />;

  const body = props.done ? (
    <VStack alignment="leading" spacing={4}>
      <Text modifiers={[font({ size: 28, weight: 'heavy', design: 'rounded' }), foregroundStyle(ink)]}>
        {props.exercise}
      </Text>
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(muted)]}>{props.target}</Text>
    </VStack>
  ) : rest ? (
    // Repos : le minuteur en gros sur fond soleil, et ce qu'il faut charger ensuite
    // The lock screen cuts what goes past ~160 pt: no header, no second timer, the button inside
    sticker(
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 10 })]}>
        <HStack alignment="center" spacing={10}>
          <VStack alignment="leading" spacing={0}>
            <Text modifiers={[font({ size: 13, weight: 'heavy', design: 'rounded' }), foregroundStyle(ink)]}>
              {props.labels.rest}
            </Text>
            <Text
              timerInterval={rest}
              countsDown
              modifiers={[
                font({ size: 40, weight: 'heavy', design: 'rounded' }),
                monospacedDigit(),
                foregroundStyle(ink),
                lineLimit(1),
              ]}
            />
          </VStack>
          <Spacer />
          <VStack alignment="trailing" spacing={2}>
            <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(muted)]}>{props.labels.upNext}</Text>
            <Text
              modifiers={[
                font({ size: 20, weight: 'heavy', design: 'rounded' }),
                foregroundStyle(ink),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}
            >
              {props.target}
            </Text>
            <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(muted), lineLimit(1)]}>
              {props.exercise}
            </Text>
          </VStack>
        </HStack>
        {plates || props.canValidate ? (
          <HStack alignment="center" spacing={8}>
            {plates}
            <Spacer />
            {validateButton('regular')}
          </HStack>
        ) : null}
      </VStack>,
      sunSoft,
      16,
    )
  ) : (
    <HStack alignment="center" spacing={12}>
      <VStack alignment="leading" spacing={4}>
        <Text
          modifiers={[
            font({ size: 38, weight: 'heavy', design: 'rounded' }),
            monospacedDigit(),
            foregroundStyle(ink),
            lineLimit(1),
            minimumScaleFactor(0.5),
          ]}
        >
          {props.target}
        </Text>
        {plates}
      </VStack>
      <Spacer />
      {validate}
    </HStack>
  );

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[padding({ all: 14 }), activityBackgroundTint(paper), foregroundStyle(ink)]}
      >
        {rest ? null : header}
        {body}
        {rest || props.done ? null : bar}
      </VStack>
    ),
    compactLeading: <Image systemName="dumbbell.fill" color={coral} />,
    compactTrailing: rest ? (
      <Text timerInterval={rest} countsDown modifiers={[monospacedDigit(), foregroundStyle(coral)]} />
    ) : (
      <Text modifiers={[font({ weight: 'semibold', design: 'rounded' }), foregroundStyle(island)]}>
        {props.setShort}
      </Text>
    ),
    minimal: rest ? (
      <ProgressView timerInterval={rest} countsDown modifiers={[tint(coral)]} />
    ) : (
      <Image systemName="dumbbell.fill" color={coral} />
    ),
    expandedLeading: (
      <HStack spacing={6} modifiers={[padding({ leading: 4 })]}>
        <Image systemName="dumbbell.fill" color={coral} />
        <Text modifiers={[font({ size: 15, weight: 'bold', design: 'rounded' }), foregroundStyle(islandMuted)]}>
          {props.setLabel}
        </Text>
      </HStack>
    ),
    expandedTrailing: rest ? (
      <Text
        timerInterval={rest}
        countsDown
        modifiers={[
          font({ size: 22, weight: 'heavy', design: 'rounded' }),
          monospacedDigit(),
          foregroundStyle(coral),
          padding({ trailing: 4 }),
        ]}
      />
    ) : null,
    expandedCenter: (
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(island), lineLimit(1)]}>
        {props.exercise}
      </Text>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ horizontal: 8 })]}>
        <HStack spacing={12}>
          <VStack alignment="leading" spacing={4}>
            <Text
              modifiers={[
                font({ size: 30, weight: 'heavy', design: 'rounded' }),
                monospacedDigit(),
                foregroundStyle(island),
                lineLimit(1),
                minimumScaleFactor(0.6),
              ]}
            >
              {props.target}
            </Text>
            {props.plates ? (
              <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(islandMuted), lineLimit(1)]}>
                {props.plates}
              </Text>
            ) : null}
          </VStack>
          <Spacer />
          {validate}
        </HStack>
        {rest ? <ProgressView timerInterval={rest} countsDown modifiers={[tint(coral)]} /> : null}
      </VStack>
    ),
  };
};

export default createLiveActivity('WorkoutActivity', WorkoutActivity);
