import React from 'react';

import Analyzer from 'Parser/Core/Analyzer';

import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import { formatPercentage } from 'common/format';

import StatisticListBoxItem from 'Interface/Others/StatisticListBoxItem';

import SoulShardTracker from '../SoulShards/SoulShardTracker';

class SoulConduit extends Analyzer {
  static dependencies = {
    soulShardTracker: SoulShardTracker,
    };

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasTalent(SPELLS.SOUL_CONDUIT_TALENT.id);
  }

  subStatistic() {
    const spent = this.soulShardTracker.spent / 10;
    const shardsGained = this.soulShardTracker.getGeneratedBySpell(SPELLS.SOUL_CONDUIT_SHARD_GEN.id) / 10;
    return (
      <StatisticListBoxItem
        title={<React.Fragment>Shards generated with <SpellLink id={SPELLS.SOUL_CONDUIT_TALENT.id} /></React.Fragment>}
        value={shardsGained}
        valueTooltip={`Your Soul Conduit refunded ${formatPercentage(shardsGained/spent)} % of soul shards spent`}
      />
    );
  }
}

export default SoulConduit;
