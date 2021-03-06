import React from 'react';

import SPELLS from 'common/SPELLS/index';
import { formatPercentage } from 'common/format';
import SpellLink from 'common/SpellLink';

import Analyzer from 'Parser/Core/Analyzer';
import Enemies from 'Parser/Core/Modules/Enemies';

import StatisticListBoxItem from 'Interface/Others/StatisticListBoxItem';

class AgonyUptime extends Analyzer {
  static dependencies = {
    enemies: Enemies,
  };

  get uptime() {
    return this.enemies.getBuffUptime(SPELLS.AGONY.id) / this.owner.fightDuration;
  }

  get suggestionThresholds() {
    return {
      actual: this.uptime,
      isLessThan: {
        minor: 0.95,
        average: 0.9,
        major: 0.8,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    let text;
    if (this.selectedCombatant.hasTalent(SPELLS.WRITHE_IN_AGONY_TALENT.id)) {
      text = <React.Fragment>Your <SpellLink id={SPELLS.AGONY.id} /> uptime can be improved as it is your main source of Soul Shards. Try to pay more attention to your Agony on the boss, especially since you're using <SpellLink id={SPELLS.WRITHE_IN_AGONY_TALENT.id} /> talent.</React.Fragment>;
    } else {
      text = <React.Fragment>Your <SpellLink id={SPELLS.AGONY.id} /> uptime can be improved as it is your main source of Soul Shards. Try to pay more attention to your Agony on the boss, perhaps use some debuff tracker.</React.Fragment>;
    }
    when(this.suggestionThresholds)
      .addSuggestion((suggest, actual, recommended) => {
        return suggest(text)
          .icon(SPELLS.AGONY.icon)
          .actual(`${formatPercentage(actual)}% Agony uptime`)
          .recommended(`> ${formatPercentage(recommended)}% is recommended`);
      });
  }

  subStatistic() {
    return (
      <StatisticListBoxItem
        title={<React.Fragment><SpellLink id={SPELLS.AGONY.id} /> uptime</React.Fragment>}
        value={`${formatPercentage(this.uptime)} %`}
      />
    );
  }
}

export default AgonyUptime;
