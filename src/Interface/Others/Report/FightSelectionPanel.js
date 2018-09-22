import React from 'react';
import PropTypes from 'prop-types';
import Toggle from 'react-toggle';
import { Link } from 'react-router-dom';

import makeAnalyzerUrl from 'Interface/common/makeAnalyzerUrl';
import FightSelectionPanelList from 'Interface/Others/Report/FightSelectionPanelList';

class FightSelectionPanel extends React.PureComponent {
  static propTypes = {
    report: PropTypes.shape({
      fights: PropTypes.array.isRequired,
    }).isRequired,
    refreshReport: PropTypes.func.isRequired,
  };
  state = {
    killsOnly: false,
  };

  render() {
    const { report, refreshReport } = this.props;
    const { killsOnly } = this.state;

    return (
      <div className="panel">
        <div className="panel-heading">
          <div className="row">
            <div className="col-md-8">
              <h2>Select the fight to parse</h2>
            </div>
            <div className="col-md-4 text-right toggle-control action-buttons">
              <Toggle
                checked={killsOnly}
                icons={false}
                onChange={event => this.setState({ killsOnly: event.currentTarget.checked })}
                id="kills-only-toggle"
              />
              <label htmlFor="kills-only-toggle">
                {' '}Kills only
              </label>
              <Link
                to={makeAnalyzerUrl(report)}
                onClick={refreshReport}
                data-tip="This will refresh the fights list which can be useful if you're live logging."
              >
                <span className="glyphicon glyphicon-refresh" aria-hidden="true" /> Refresh
              </Link>
            </div>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <FightSelectionPanelList
            report={report}
            fights={report.fights}
            killsOnly={killsOnly}
          />
        </div>
      </div>
    );
  }
}

export default FightSelectionPanel;
