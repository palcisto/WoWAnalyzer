import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';

import getFightName from 'common/getFightName';
import { fetchCombatants, LogNotFoundError } from 'common/fetchWclApi';
import { captureException } from 'common/errorLogger';
import ActivityIndicator from 'Interface/common/ActivityIndicator';
import DocumentTitle from 'Interface/common/DocumentTitle';
import { setCombatants } from 'Interface/actions/combatants';
import { getPlayerId, getPlayerName } from 'Interface/selectors/url/report';
import handleApiError from 'Interface/Others/Report/handleApiError';
import makeAnalyzerUrl from 'Interface/common/makeAnalyzerUrl';

import PlayerSelectionPanel from './PlayerSelectionPanel';

class PlayerSelection extends React.PureComponent {
  static propTypes = {
    report: PropTypes.shape({
      code: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      friendlies: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })),
    }).isRequired,
    fight: PropTypes.shape({
      start_time: PropTypes.number.isRequired,
      end_time: PropTypes.number.isRequired,
    }).isRequired,
    setCombatants: PropTypes.func.isRequired,
    playerName: PropTypes.string,
    playerId: PropTypes.number,
    children: PropTypes.func.isRequired,
    history: PropTypes.shape({
      push: PropTypes.func.isRequired, // adds to browser history
    }).isRequired,
  };
  state = {
    combatants: null,
  };

  setState(error = null, combatants = null) {
    super.setState({
      error,
      combatants,
    });
    // We need to set the combatants in the global state so the NavigationBar, which is not a child of this component, can also use it
    this.props.setCombatants(combatants);
  }
  resetState() {
    this.setState(null, null);
  }

  componentDidMount() {
    // noinspection JSIgnoredPromiseFromCall
    this.loadCombatants(this.props.report, this.props.fight);
  }
  componentDidUpdate(prevProps, prevState, prevContext) {
    if (this.props.report !== prevProps.report || this.props.fight !== prevProps.fight) {
      // noinspection JSIgnoredPromiseFromCall
      this.loadCombatants(this.props.report, this.props.fight);
    }
  }
  componentWillUnmount() {
    ReactTooltip.hide();
  }
  async loadCombatants(report, fight) {
    try {
      this.resetState();
      const combatants = await fetchCombatants(report.code, fight.start_time, fight.end_time);
      if (this.props.report !== report || this.props.fight !== fight) {
        return; // the user switched report/fight already
      }
      this.setState(null, combatants);
    } catch (err) {
      const isCommonError = err instanceof LogNotFoundError;
      if (!isCommonError) {
        captureException(err);
      }
      this.setState(err, null);
    }
  }

  renderError(error) {
    return handleApiError(error, () => {
      this.resetState();
      this.props.history.push(makeAnalyzerUrl());
    });
  }
  renderLoading() {
    return <ActivityIndicator text="Fetching player info..." />;
  }
  render() {
    const { report, fight, playerName, playerId } = this.props;

    const error = this.state.error;
    if (error) {
      return this.renderError(error);
    }

    const combatants = this.state.combatants;
    if (!combatants) {
      return this.renderLoading();
    }

    const players = playerId ? report.friendlies.filter(friendly => friendly.id === playerId) : report.friendlies.filter(friendly => friendly.name === playerName);
    const player = players[0];
    const hasDuplicatePlayers = players.length > 1;
    const combatant = player && combatants.find(combatant => combatant.sourceID === player.id);
    if (!player || hasDuplicatePlayers || !combatant || !combatant.specID) {
      if (player) {
        // Player data was in the report, but there was another issue
        if (hasDuplicatePlayers) {
          alert(`It appears like another "${playerName}" is in this log, please select the correct one`);
        } else if (!combatant) {
          alert('Player data does not seem to be available for the selected player in this fight.');
        } else if (!combatant.specID) {
          alert('The data received from WCL for this player is corrupt, this player can not be analyzed in this fight.');
        }
      }
      return (
        <div className="container">
          <h1>
            <div className="back-button">
              <Link to={`/report/${report.code}`} data-tip="Back to fight selection">
                <span className="glyphicon glyphicon-chevron-left" aria-hidden="true" />
              </Link>
            </div>
            Player selection
          </h1>

          <PlayerSelectionPanel
            report={report}
            fight={fight}
            combatants={combatants}
          />
        </div>
      );
    }

    return (
      <React.Fragment>
        {/* TODO: Refactor the DocumentTitle away */}
        <DocumentTitle title={`${getFightName(report, fight)} by ${player.name} in ${report.title}`} />

        {this.props.children(player, combatant, combatants)}
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  playerName: getPlayerName(state),
  playerId: getPlayerId(state),
});
export default compose(
  withRouter,
  connect(mapStateToProps, {
    setCombatants,
  })
)(PlayerSelection);
