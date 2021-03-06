import React from 'react';

import SPELLS from 'common/SPELLS';
import SPECS from 'game/SPECS';
import ITEMS from 'common/ITEMS';
import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import ItemLink from 'common/ItemLink';

import Analyzer from 'Parser/Core/Analyzer';
import SUGGESTION_IMPORTANCE from 'Parser/Core/ISSUE_IMPORTANCE';

const debug = false;

const HEALER_SPECS = [
  SPECS.HOLY_PALADIN.id,
  SPECS.RESTORATION_DRUID.id,
  SPECS.HOLY_PRIEST.id,
  SPECS.DISCIPLINE_PRIEST.id,
  SPECS.MISTWEAVER_MONK.id,
  SPECS.RESTORATION_SHAMAN.id,
];

const PRE_POTIONS = [
  SPELLS.BATTLE_POTION_OF_INTELLECT.id,
  SPELLS.BATTLE_POTION_OF_STRENGTH.id,
  SPELLS.BATTLE_POTION_OF_AGILITY.id,
  SPELLS.BATTLE_POTION_OF_STAMINA.id,
  SPELLS.POTION_OF_RISING_DEATH.id,
  SPELLS.POTION_OF_BURSTING_BLOOD.id,
  SPELLS.STEELSKIN_POTION.id,
];

const SECOND_POTIONS = [
  SPELLS.BATTLE_POTION_OF_INTELLECT.id,
  SPELLS.BATTLE_POTION_OF_STRENGTH.id,
  SPELLS.BATTLE_POTION_OF_AGILITY.id,
  SPELLS.BATTLE_POTION_OF_STAMINA.id,
  SPELLS.POTION_OF_RISING_DEATH.id,
  SPELLS.POTION_OF_BURSTING_BLOOD.id,
  SPELLS.STEELSKIN_POTION.id,
  SPELLS.COASTAL_MANA_POTION.id,
  SPELLS.COASTAL_REJUVENATION_POTION.id,
  SPELLS.POTION_OF_REPLENISHMENT.id,
];

const COMMON_MANA_POTION_AMOUNT = 11084;

class PrePotion extends Analyzer {
  usedPrePotion = false;
  usedSecondPotion = false;
  neededManaSecondPotion = false;

  on_toPlayer_applybuff(event) {
    const spellId = event.ability.guid;
    if(PRE_POTIONS.includes(spellId) && event.prepull) {
      this.usedPrePotion = true;
    }
  }

  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;

    if (SECOND_POTIONS.includes(spellId)) {
      this.usedSecondPotion = true;
    }

    if (event.classResources && event.classResources[0] && event.classResources[0].type === RESOURCE_TYPES.MANA.id) {
      const resource = event.classResources[0];
      const manaLeftAfterCast = resource.amount - resource.cost;
      if (manaLeftAfterCast < COMMON_MANA_POTION_AMOUNT) {
        this.neededManaSecondPotion = true;
      }
    }
  }

  on_finished() {
    if (debug) {
      console.log(`used potion:${this.usedPrePotion}`);
      console.log(`used 2nd potion:${this.usedSecondPotion}`);
    }
  }

  get prePotionSuggestionThresholds() {
    return {
      actual: this.usedPrePotion,
      isEqual: false,
      style: 'boolean',
    };
  }
  get secondPotionSuggestionThresholds() {
    return {
      actual: this.usedSecondPotion,
      isEqual: false,
      style: 'boolean',
    };
  }

  suggestions(when) {
    when(this.prePotionSuggestionThresholds)
      .addSuggestion((suggest) => {
        return suggest(<React.Fragment>You did not use a potion before combat. Using a potion before combat allows you the benefit of two potions in a single fight. A potion such as <ItemLink id={ITEMS.BATTLE_POTION_OF_INTELLECT.id} /> can be very effective (even for healers), especially during shorter encounters.</React.Fragment>)
          .icon(ITEMS.BATTLE_POTION_OF_INTELLECT.icon)
          .staticImportance(SUGGESTION_IMPORTANCE.MINOR);
      });
    when(this.secondPotionSuggestionThresholds)
      .addSuggestion((suggest) => {
        let suggestionText;
        let importance;
        // Only healer specs would use a mana potion all other specs either don't use mana as a primary resource (such as bears)
        // or have another method to regen mana, this fixes an issue with Guardian where they shift out of bear form and cast a
        // spell but mana is not their primary resource and should not use a mana potion.
        const healerSpec = HEALER_SPECS.includes(this.selectedCombatant.specId);
        if (!healerSpec) {
          suggestionText = <React.Fragment>You forgot to use a potion during combat. By using a potion during combat such as <ItemLink id={ITEMS.BATTLE_POTION_OF_INTELLECT.id} /> you can increase your DPS (especially if lined up with damage cooldowns) and/or suvivability during a fight.</React.Fragment>;
          importance = SUGGESTION_IMPORTANCE.MINOR;
        } else if (!this.neededManaSecondPotion) {
          suggestionText = <React.Fragment>You forgot to use a potion during combat. Using a potion during combat allows you the benefit of either increasing output through <ItemLink id={ITEMS.BATTLE_POTION_OF_INTELLECT.id} /> or allowing you to gain mana using <ItemLink id={ITEMS.COASTAL_MANA_POTION.id} />, for example.</React.Fragment>;
          importance = SUGGESTION_IMPORTANCE.MINOR;
        } else {
          suggestionText = <React.Fragment>You ran out of mana (OOM) during the encounter without using a second potion. Use a second potion such as <ItemLink id={ITEMS.COASTAL_MANA_POTION.id} />or if the fight allows <ItemLink id={ITEMS.POTION_OF_REPLENISHMENT.id} /> to regenerate some mana.</React.Fragment>;
          importance = SUGGESTION_IMPORTANCE.REGULAR;
        }
        return suggest(suggestionText)
          .icon(ITEMS.LEYTORRENT_POTION.icon)
          .staticImportance(importance);
      });
  }
}

export default PrePotion;
