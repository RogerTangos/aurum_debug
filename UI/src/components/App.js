import React from 'react';
import Search from './Search';
import Results from './Results';
import Graph from './Graph';
import Pandas from './Pandas';

class App extends React.Component {
  constructor() {
    super();

    this.updateQuery = this.updateQuery.bind(this);
    this.updateResult = this.updateResult.bind(this);
    this.addSelection = this.addSelection.bind(this);
    this.addGraphEdge = this.addGraphEdge.bind(this);
    this.setQueryEdgeType = this.setQueryEdgeType.bind(this);
    // this.updateGraphNodes = this.updateGraphNodes.bind(this);
    // this.updateGraphEdges = this.updateGraphEdges.bind(this);
    // Initial State
    this.state = {
      query: '', // the current query
      queryEdges: [], // Aurum edges returned from the query. NOT used for the graph viz.
      sources: {}, // the HITs returned from the query


      // This is what will actually display on the graph
      selection: {}, // the table that the user selected (with HITs inside the obj)
      graphEdges: [], // no way to be populated in the UI yet
      originNode: false, // node that new search results were reached from. null/false/undefined if the search results were reached from the search box
      queryEdgeType: '',

    };
  }


  // // updates the graph state, which  propegates to Graph.js Sigma.props.graph
  // // a testing method
  // updateGraphEdges(){
  //   const graphEdges = [{eid: "e1", source:"n1", target:"n2", label:"e1"}];
  //   this.setState({ graphEdges });
  // }


  // // updates the graph state, which  propegates to Graph.js Sigma.props.graph
  // // a testing method
  // updateGraphNodes(){
  //   const selection = {
  //     "n1": {
  //       "2417835865": {
  //         "db_name": "ma_data",
  //         "field_name": "BLDG_NAME"}},
  //     "n2": {
  //       "abcdefg": {
  //         "db_name": "ma_data",
  //         "field_name": "FOO_COL"}}}
  //   this.setState({ selection });
  // }


  // This data structure is a bit more complicated.
  // Needs additional setting and getting
  addSelection(selected) {
    // get the tableName/Key
    const tableName = selected['source_name']
    const nid = selected['nid']

    const selection = {...this.state.selection};

    // insert the table if necessary
    if(selection[tableName] === undefined) {
      selection[tableName] = {};
    }

    // insert the field
    selection[tableName][nid] = selected;

    // Does the origin node exist in the displayed graph?
    // if so, draw a graph between it and the current node
    if (this.state.selection[this.state.originNode]) {
      this.addGraphEdge(this.state.originNode, tableName, this.state.queryEdgeType, this.state.queryEdgeType + ' ' + this.state.originNode + ' ' + tableName);
    }

    this.setState({ selection });
  }

  removeSelection(nid) {
    const selection = {...this.state.selection};
    delete selection[nid];
    this.setState({ selection }) ;
  }

  clearSelection(){
    this.setState({selection : {}})
  }

  addGraphEdge(source, target, label, eid){
    var graphEdges = this.state.graphEdges;
    var color = '';

    switch (label){
      case 'schema_sim':
        color = '#FF7271';
        break;
      case 'content_sim':
        color = '#D16EE8';
        break;
      case 'pkfk':
        color = '#9088FF';
        break;
      default:
        color = 'lightgray';
        break;
    }


    const edge = {source: source, target: target, label: label, eid: eid, color: color};

    // check to see if an edge with this edge id already exists. If so, don't add it.
    for (var i = 0; i < this.state.graphEdges.length; i++) {
      var graphEdge = this.state.graphEdges[i]
      if (graphEdge.eid === eid){
        return
      }
    }

    graphEdges.push(edge);
    this.setState({ graphEdges });
  }

  // if the quer results came from an edge search, set the edge type
  setQueryEdgeType(queryEdgeType){
    this.setState({ queryEdgeType });
  }


  updateQuery(query, originNode) {
    this.setState({ query });
    this.setState({originNode});
    this.context.router.transitionTo(`/${query}`);
  }

  updateResult(result) {
    var sources = result['sources'];
    var queryEdges = result['edges'];
    this.setState( { sources });
    this.setState( { queryEdges });
  }


  render() {
    return (
      <div className="aurum">
        <Search
          query={this.state.query}
          sources={this.state.sources}
          edges={this.state.queryEdges}
          updateQuery={this.updateQuery}
          updateResult={this.updateResult}
        />
        <div id="middle">
          <Results
            sources={this.state.sources}
            edges={this.state.queryEdges}
            selectHit={this.state.selected}
            addSelection={this.addSelection}
          />
          <div id="right">
            <Graph
              graphEdges={this.state.graphEdges}
              selection={this.state.selection}
              updateQuery={this.updateQuery}
              updateResult={this.updateResult}
              setQueryEdgeType={this.setQueryEdgeType}
            />
            <Pandas />
          </div>
        </div>
        <footer>
        </footer>
      </div>
      )
  }
}

App.contextTypes = {
  router: React.PropTypes.object
}

export default App;
