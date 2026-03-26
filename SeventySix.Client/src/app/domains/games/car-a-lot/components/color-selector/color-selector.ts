/**
 * Color and Character Selector component.
 * Allows real-time kart color and character selection during gameplay.
 */

import { ChangeDetectionStrategy, Component, output, OutputEmitterRef, signal, WritableSignal } from "@angular/core";
import { CharacterType, KartColor } from "@games/car-a-lot/models/car-a-lot.models";

/** Color and character selection interface for Car-a-Lot. */
@Component(
	{
		selector: "app-color-selector",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./color-selector.html",
		styleUrl: "./color-selector.scss"
	})
export class ColorSelectorComponent
{
	/** Emits when the Start Game button is clicked. */
	readonly startGame: OutputEmitterRef<void> =
		output();

	/** Emits when the user selects a new kart color. */
	readonly kartColorChange: OutputEmitterRef<KartColor> =
		output<KartColor>();

	/** Emits when the user selects a new character. */
	readonly characterChange: OutputEmitterRef<CharacterType> =
		output<CharacterType>();

	/** Currently selected kart color. */
	protected readonly selectedColor: WritableSignal<KartColor> =
		signal(KartColor.Pink);

	/** Currently selected character type. */
	protected readonly selectedCharacter: WritableSignal<CharacterType> =
		signal(CharacterType.Princess);

	/** Available kart colors for the selector buttons. */
	protected readonly kartColors: readonly KartColor[] =
		[KartColor.Pink, KartColor.Red, KartColor.TealBlue];

	/** Available character types for the selector buttons. */
	protected readonly characterTypes: readonly CharacterType[] =
		[CharacterType.Princess, CharacterType.Prince];

	/**
	 * Handle start game button click — emit event to parent.
	 */
	protected onStartGame(): void
	{
		this.startGame.emit();
	}

	/**
	 * Handle kart color selection.
	 * @param color
	 * The selected kart color.
	 */
	protected selectColor(color: KartColor): void
	{
		this.selectedColor.set(color);
		this.kartColorChange.emit(color);
	}

	/**
	 * Handle character selection.
	 * @param character
	 * The selected character type.
	 */
	protected selectCharacter(character: CharacterType): void
	{
		this.selectedCharacter.set(character);
		this.characterChange.emit(character);
	}

	/** CSS color value lookup for kart color buttons. */
	protected readonly colorCssMap: Readonly<Record<KartColor, string>> =
		{
			[KartColor.Pink]: "#ff69b4",
			[KartColor.Red]: "#e61919",
			[KartColor.TealBlue]: "#008080"
		};

	/** Display label lookup for kart color accessibility. */
	protected readonly colorLabelMap: Readonly<Record<KartColor, string>> =
		{
			[KartColor.Pink]: "Pink",
			[KartColor.Red]: "Red",
			[KartColor.TealBlue]: "Teal Blue"
		};
}