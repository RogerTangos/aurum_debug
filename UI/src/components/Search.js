import React from 'react';
import { makeRequest } from '../ajax'

class Search extends React.Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.handleResponse = this.handleResponse.bind(this);

    this.state = {
      userQuery: ''
    };
  }


  componentWillMount() {
    // If the query is passed in the url on the first load
    // this will catch it
    const query = location.pathname.slice(1, location.pathname.length);
    var e = {}
    e['target'] = {}
    e['target']['value'] = query
    this.handleChange( e );
    console.log('Search.js componentWillMount');
  }

  componentDidMount(){
    const query = 'GunnariTestQuery';
    this.setState( {userQuery: query });

    this.handleResponse('foo')
  }

  handleResponse(response) {
    // const json = JSON.parse(response.responseText);
    const json = {
      "edges": [
        [
          {
            "db_name": "school",
            "field_name": "school",
            "nid": 6,
            "score": -1,
            "source_name": "school"
          },
          {
            "db_name": "ma_data",
            "field_name": "building_subcategory",
            "nid": 587248320,
            "score": 3.3241112,
            "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
          }
        ]
      ],
      "sources": {
        "Boston Municipal Energy Data_bcnb-bux2.csv": {
          "field_res": [
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3241112,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3207755,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3177924,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3161294,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3161294,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3161027,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3128018,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.3070745,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.292893,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            },
            {
              "db_name": "ma_data",
              "field_name": "building_subcategory",
              "nid": 587248320,
              "score": 3.2115924,
              "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
            }
          ],
          "source_res": {
            "db_name": "ma_data",
            "field_name": "building_subcategory",
            "nid": 587248320,
            "score": 3.3241112,
            "source_name": "Boston Municipal Energy Data_bcnb-bux2.csv"
          }
        }
      }
    }

    this.props.updateQuery(this.state.userQuery, false);
    this.props.updateResult(json);
  }

  handleChange(e){
    const query = e.target.value;
    this.setState({ userQuery: query });
    makeRequest(query, this.handleResponse);
  }

  render() {

   return (
    <header>
      <input
        type="text"
        id="search-field"
        placeholder="Search by table, column, or keyword"
        onChange={(e) => this.handleChange(e)}
       />
    </header>
    )
  }
}


Search.propTypes = {
  query: React.PropTypes.string.isRequired,
  edges: React.PropTypes.array.isRequired,
  sources: React.PropTypes.object.isRequired,
  updateQuery: React.PropTypes.func.isRequired,
  updateResult: React.PropTypes.func.isRequired
}


export default Search