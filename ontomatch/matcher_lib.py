from enum import Enum
import time
from collections import defaultdict
from nltk.corpus import stopwords
from dataanalysis import nlp_utils as nlp
from ontomatch import glove_api
from ontomatch import ss_utils as SS
from datasketch import MinHash, MinHashLSH
from knowledgerepr.networkbuilder import LSHRandomProjectionsIndex
from dataanalysis import dataanalysis as da
import operator
from collections import namedtuple


class MatchingType(Enum):
    L1_CLASSNAME_ATTRVALUE = 0
    L2_CLASSVALUE_ATTRVALUE = 1
    L3_CLASSCTX_RELATIONCTX = 2
    L4_CLASSNAME_RELATIONNAME_SYN = 3
    L42_CLASSNAME_RELATIONNAME_SEM = 4
    L5_CLASSNAME_ATTRNAME_SYN = 5
    L52_CLASSNAME_ATTRNAME_SEM = 6
    L6_CLASSNAME_RELATION_SEMSIG = 7
    L7_CLASSNAME_ATTRNAME_FUZZY = 8


class SimpleTrie:

    def __init__(self):
        self._leave = "_leave_"
        self.root = dict()

    def add_sequences(self, sequences):
        for seq in sequences:
            current_dict = self.root
            for token in seq:
                current_dict = current_dict.setdefault(token, {})  # another dict as default
            current_dict[self._leave] = self._leave
        return self.root

    def longest_prefix(self):
        return

class Matching:

    def __init__(self, db_name, source_name):
        self.db_name = db_name
        self.source_name = source_name
        self.source_level_matchings = defaultdict(lambda: defaultdict(list))
        self.attr_matchings = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    def add_relation_correspondence(self, kr_name, class_name, matching_type):
        self.source_level_matchings[kr_name][class_name].append(matching_type)

    def add_attribute_correspondence(self, attr_name, kr_name, class_name, matching_type):
        self.attr_matchings[attr_name][kr_name][class_name].append(matching_type)

    def __str__(self):
        header = self.db_name + " - " + self.source_name
        relation_matchings = list()
        relation_matchings.append(header)
        if len(self.source_level_matchings.items()) > 0:
            for kr_name, values in self.source_level_matchings.items():
                for class_name, matchings in values.items():
                    line = kr_name + " - " + class_name + " : " + str(matchings)
                    relation_matchings.append(line)
        else:
            line = "0 relation matchings"
            relation_matchings.append(line)
        if len(self.attr_matchings.items()) > 0:
            for attr_name, values in self.attr_matchings.items():
                for kr_name, classes in values.items():
                    for class_name, matchings in classes.items():
                        line = attr_name + " -> " + kr_name + " - " + class_name + " : " + str(matchings)
                        relation_matchings.append(line)
        string_repr = '\n'.join(relation_matchings)
        return string_repr

    def print_serial(self):
        relation_matchings = []
        for kr_name, values in self.source_level_matchings.items():
            for class_name, matchings in values.items():
                line = self.db_name + " %%% " + self.source_name + " %%% _ -> " + kr_name \
                       + " %%% " + class_name + " %%% " + str(matchings)
                relation_matchings.append(line)
        for attr_name, values in self.attr_matchings.items():
            for kr_name, classes in values.items():
                for class_name, matchings in classes.items():
                    line = self.db_name + " %%% " + self.source_name + " %%% " + attr_name \
                           + " -> " + kr_name + " %%% " + class_name + " %%% " + str(matchings)
                    relation_matchings.append(line)
        #string_repr = '\n'.join(relation_matchings)
        return relation_matchings


def combine_matchings(all_matchings):

    def process_attr_matching(building_matching_objects, m, matching_type):
        sch, krn = m
        db_name, source_name, field_name = sch
        kr_name, class_name = krn
        mobj = building_matching_objects.get((db_name, source_name), None)
        if mobj is None:
            mobj = Matching(db_name, source_name)
        mobj.add_attribute_correspondence(field_name, kr_name, class_name, matching_type)
        building_matching_objects[(db_name, source_name)] = mobj

    def process_relation_matching(building_matching_objects, m, matching_type):
        sch, krn = m
        db_name, source_name, field_name = sch
        kr_name, class_name = krn
        mobj = building_matching_objects.get((db_name, source_name), None)
        if mobj is None:
            mobj = Matching(db_name, source_name)
        mobj.add_relation_correspondence(kr_name, class_name, matching_type)
        building_matching_objects[(db_name, source_name)] = mobj

    l1_matchings = all_matchings[MatchingType.L1_CLASSNAME_ATTRVALUE]
    l2_matchings = all_matchings[MatchingType.L2_CLASSVALUE_ATTRVALUE]
    l4_matchings = all_matchings[MatchingType.L4_CLASSNAME_RELATIONNAME_SYN]
    l42_matchings = all_matchings[MatchingType.L42_CLASSNAME_RELATIONNAME_SEM]
    l5_matchings = all_matchings[MatchingType.L5_CLASSNAME_ATTRNAME_SYN]
    l52_matchings = all_matchings[MatchingType.L52_CLASSNAME_ATTRNAME_SEM]
    l6_matchings = all_matchings[MatchingType.L6_CLASSNAME_RELATION_SEMSIG]
    l7_matchings = all_matchings[MatchingType.L7_CLASSNAME_ATTRNAME_FUZZY]

    building_matching_objects = defaultdict(None)  # (db_name, source_name) -> stuff

    for m in l1_matchings:
        process_attr_matching(building_matching_objects, m, MatchingType.L1_CLASSNAME_ATTRVALUE)

    for m in l2_matchings:
        process_attr_matching(building_matching_objects, m, MatchingType.L2_CLASSVALUE_ATTRVALUE)

    for m in l4_matchings:
        process_relation_matching(building_matching_objects, m, MatchingType.L4_CLASSNAME_RELATIONNAME_SYN)

    for m in l42_matchings:
        process_relation_matching(building_matching_objects, m, MatchingType.L42_CLASSNAME_RELATIONNAME_SEM)

    for m in l5_matchings:
        process_attr_matching(building_matching_objects, m, MatchingType.L5_CLASSNAME_ATTRNAME_SYN)

    for m in l52_matchings:
        process_attr_matching(building_matching_objects, m, MatchingType.L52_CLASSNAME_ATTRNAME_SEM)

    for m in l6_matchings:
        process_relation_matching(building_matching_objects, m, MatchingType.L6_CLASSNAME_RELATION_SEMSIG)

    for m in l7_matchings:
        process_attr_matching(building_matching_objects, m, MatchingType.L7_CLASSNAME_ATTRNAME_FUZZY)

    return building_matching_objects


def combine_matchings2(all_matchings):
    # TODO: divide running score, based on whether content was available or not (is it really necessary?)

    # L1 creates its own matchings
    l1_matchings = all_matchings[MatchingType.L1_CLASSNAME_ATTRVALUE]

    # L2, L5, L52 and L6 create another set of matchings
    l2_matchings = all_matchings[MatchingType.L2_CLASSVALUE_ATTRVALUE]
    l5_matchings = all_matchings[MatchingType.L5_CLASSNAME_ATTRNAME_SYN]
    l52_matchings = all_matchings[MatchingType.L52_CLASSNAME_ATTRNAME_SEM]
    l6_matchings = all_matchings[MatchingType.L6_CLASSNAME_RELATION_SEMSIG]
    l7_matchings = all_matchings[MatchingType.L7_CLASSNAME_ATTRNAME_FUZZY]

    l_combined = dict()
    for schema, kr in l1_matchings:
        db_name, src_name, attr_name = schema
        kr_name, cla_name = kr
        l_combined[(db_name, src_name, attr_name, kr_name, cla_name)] = (
        (schema, kr), [MatchingType.L1_CLASSNAME_ATTRVALUE])

    for schema, kr in l7_matchings:
        db_name, src_name, attr_name = schema
        kr_name, cla_name = kr
        if (db_name, src_name, attr_name, kr_name, cla_name) in l_combined:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)][1].append(
                MatchingType.L7_CLASSNAME_ATTRNAME_FUZZY)

    for schema, kr in l2_matchings:
        db_name, src_name, attr_name = schema
        kr_name, cla_name = kr
        if (db_name, src_name, attr_name, kr_name, cla_name) in l_combined:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)][1].append(
                MatchingType.L2_CLASSNAME_ATTRNAME_SYN)
        else:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)] = (
            (schema, kr), [MatchingType.L2_CLASSVALUE_ATTRVALUE])

    for schema, kr in l5_matchings:
        db_name, src_name, attr_name = schema
        kr_name, cla_name = kr
        if (db_name, src_name, attr_name, kr_name, cla_name) in l_combined:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)][1].append(
                MatchingType.L5_CLASSNAME_ATTRNAME_SYN)
        else:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)] = (
            (schema, kr), [MatchingType.L5_CLASSNAME_ATTRNAME_SYN])

    for schema, kr in l52_matchings:
        db_name, src_name, attr_name = schema
        kr_name, cla_name = kr
        if (db_name, src_name, attr_name, kr_name, cla_name) in l_combined:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)][1].append(
                MatchingType.L52_CLASSNAME_ATTRNAME_SEM)
        else:
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)] = (
            (schema, kr), [MatchingType.L52_CLASSNAME_ATTRNAME_SEM])

    for schema, kr in l6_matchings:
        db_name, src_name, attr_name = schema
        kr_name, cla_name = kr
        if (db_name, src_name, attr_name, kr_name, cla_name) in l_combined:
            # TODO: only append in the matching types are something except L1?
            l_combined[(db_name, src_name, attr_name, kr_name, cla_name)][1].append(
                MatchingType.L6_CLASSNAME_RELATION_SEMSIG)

    # L4 and L42 have their own matching too
    l4_matchings = all_matchings[MatchingType.L4_CLASSNAME_RELATIONNAME_SYN]
    combined_matchings = []
    for key, values in l_combined.items():
        matching = values[0]
        matching_types = values[1]
        # for el in values:
        #    matching = el[0]
        #    matching_types = el[1]
        combined_matchings.append((matching, matching_types))

    combined_matchings = sorted(combined_matchings, key=lambda x: len(x[1]), reverse=True)

    return combined_matchings, l4_matchings


def find_relation_class_attr_name_sem_matchings(network, kr_handlers):
    # Retrieve relation names

    #self.find_relation_class_name_sem_matchings()
    st = time.time()
    names = []
    seen_fields = []
    for (db_name, source_name, field_name, _) in network.iterate_values():
        orig_field_name = field_name
        if field_name not in seen_fields:
            seen_fields.append(field_name)  # seen already
            field_name = nlp.camelcase_to_snakecase(field_name)
            field_name = field_name.replace('-', ' ')
            field_name = field_name.replace('_', ' ')
            field_name = field_name.lower()
            svs = []
            for token in field_name.split():
                if token not in stopwords.words('english'):
                    sv = glove_api.get_embedding_for_word(token)
                    if sv is not None:
                        svs.append(sv)
            names.append(('attribute', (db_name, source_name, orig_field_name), svs))

    num_attributes_inserted = len(names)

    # Retrieve class names
    for kr_name, kr_handler in kr_handlers.items():
        all_classes = kr_handler.classes()
        for cl in all_classes:
            original_cl_name = cl
            cl = nlp.camelcase_to_snakecase(cl)
            cl = cl.replace('-', ' ')
            cl = cl.replace('_', ' ')
            cl = cl.lower()
            svs = []
            for token in cl.split():
                if token not in stopwords.words('english'):
                    sv = glove_api.get_embedding_for_word(token)
                    if sv is not None:
                        svs.append(sv)
            names.append(('class', (kr_name, original_cl_name), svs))

    matchings = []
    for idx_rel in range(0, num_attributes_inserted):  # Compare only with classes
        for idx_class in range(num_attributes_inserted, len(names)):
            svs_rel = names[idx_rel][2]
            svs_cla = names[idx_class][2]
            semantic_sim = SS.compute_semantic_similarity(svs_rel, svs_cla)
            if semantic_sim > 0.8:
                # match.format db_name, source_name, field_name -> class_name
                match = ((names[idx_rel][1][0], names[idx_rel][1][1], names[idx_rel][1][2]), names[idx_class][1])
                matchings.append(match)
    et = time.time()
    print("Time to relation-class (sem): " + str(et - st))
    return matchings


def find_relation_class_attr_name_matching(network, kr_handlers):
    # Retrieve relation names
    st = time.time()
    names = []
    seen_fields = []
    for (db_name, source_name, field_name, _) in network.iterate_values():
        orig_field_name = field_name
        if field_name not in seen_fields:
            seen_fields.append(field_name)  # seen already
            field_name = nlp.camelcase_to_snakecase(field_name)
            field_name = field_name.replace('-', ' ')
            field_name = field_name.replace('_', ' ')
            field_name = field_name.lower()
            m = MinHash(num_perm=64)
            for token in field_name.split():
                if token not in stopwords.words('english'):
                    m.update(token.encode('utf8'))
            names.append(('attribute', (db_name, source_name, orig_field_name), m))

    num_attributes_inserted = len(names)

    # Retrieve class names
    for kr_name, kr_handler in kr_handlers.items():
        all_classes = kr_handler.classes()
        for cl in all_classes:
            original_cl_name = cl
            cl = nlp.camelcase_to_snakecase(cl)
            cl = cl.replace('-', ' ')
            cl = cl.replace('_', ' ')
            cl = cl.lower()
            m = MinHash(num_perm=64)
            for token in cl.split():
                if token not in stopwords.words('english'):
                    m.update(token.encode('utf8'))
            names.append(('class', (kr_name, original_cl_name), m))

    # Index all the minhashes
    lsh_index = MinHashLSH(threshold=0.6, num_perm=64)

    for idx in range(len(names)):
        lsh_index.insert(idx, names[idx][2])

    matchings = []
    for idx in range(0, num_attributes_inserted):  # Compare only with classes
        N = lsh_index.query(names[idx][2])
        for n in N:
            kind_q = names[idx][0]
            kind_n = names[n][0]
            if kind_n != kind_q:
                # match.format db_name, source_name, field_name -> class_name
                match = ((names[idx][1][0], names[idx][1][1], names[idx][1][2]), names[n][1])
                matchings.append(match)
    return matchings


def find_relation_class_name_sem_matchings(network, kr_handlers):
    # Retrieve relation names
    st = time.time()
    names = []
    seen_sources = []
    for (db_name, source_name, _, _) in network.iterate_values():
        original_source_name = source_name
        if source_name not in seen_sources:
            seen_sources.append(source_name)  # seen already
            source_name = source_name.replace('-', ' ')
            source_name = source_name.replace('_', ' ')
            source_name = source_name.lower()
            svs = []
            for token in source_name.split():
                if token not in stopwords.words('english'):
                    sv = glove_api.get_embedding_for_word(token)
                    #if sv is not None:
                    svs.append(sv)  # append even None, to apply penalization later
            names.append(('relation', (db_name, original_source_name), svs))

    num_relations_inserted = len(names)

    # Retrieve class names
    for kr_name, kr_handler in kr_handlers.items():
        all_classes = kr_handler.classes()
        for cl in all_classes:
            original_cl_name = cl
            cl = nlp.camelcase_to_snakecase(cl)
            cl = cl.replace('-', ' ')
            cl = cl.replace('_', ' ')
            cl = cl.lower()
            svs = []
            for token in cl.split():
                if token not in stopwords.words('english'):
                    sv = glove_api.get_embedding_for_word(token)
                    #if sv is not None:
                    svs.append(sv)  # append even None, to apply penalization later
            names.append(('class', (kr_name, original_cl_name), svs))

    matchings = []
    for idx_rel in range(0, num_relations_inserted):  # Compare only with classes
        for idx_class in range(num_relations_inserted, len(names)):
            svs_rel = names[idx_rel][2]
            svs_cla = names[idx_class][2]
            semantic_sim = SS.compute_semantic_similarity(svs_rel, svs_cla, penalize_unknown_word=True, add_exact_matches=False)
            #semantic_sim = SS.compute_semantic_similarity(svs_rel, svs_cla)
            if semantic_sim > 0.5:
                # match.format is db_name, source_name, field_name -> class_name
                match = ((names[idx_rel][1][0], names[idx_rel][1][1], "_"), names[idx_class][1])
                matchings.append(match)
    et = time.time()
    print("Time to relation-class (sem): " + str(et - st))
    return matchings


def find_relation_class_name_matchings(network, kr_handlers):
    # Retrieve relation names
    st = time.time()
    names = []
    seen_sources = []
    for (db_name, source_name, _, _) in network.iterate_values():
        original_source_name = source_name
        if source_name not in seen_sources:
            seen_sources.append(source_name)  # seen already
            source_name = nlp.camelcase_to_snakecase(source_name)
            source_name = source_name.replace('-', ' ')
            source_name = source_name.replace('_', ' ')
            source_name = source_name.lower()
            m = MinHash(num_perm=32)
            for token in source_name.split():
                if token not in stopwords.words('english'):
                    m.update(token.encode('utf8'))
            names.append(('relation', (db_name, original_source_name), m))

    num_relations_inserted = len(names)

    # Retrieve class names
    for kr_name, kr_handler in kr_handlers.items():
        all_classes = kr_handler.classes()
        for cl in all_classes:
            original_cl_name = cl
            cl = nlp.camelcase_to_snakecase(cl)
            cl = cl.replace('-', ' ')
            cl = cl.replace('_', ' ')
            cl = cl.lower()
            m = MinHash(num_perm=32)
            for token in cl.split():
                if token not in stopwords.words('english'):
                    m.update(token.encode('utf8'))
            names.append(('class', (kr_name, original_cl_name), m))

    # Index all the minhashes
    lsh_index = MinHashLSH(threshold=0.5, num_perm=32)

    for idx in range(len(names)):
        lsh_index.insert(idx, names[idx][2])

    matchings = []
    for idx in range(0, num_relations_inserted):  # Compare only with classes
        N = lsh_index.query(names[idx][2])
        for n in N:
            kind_q = names[idx][0]
            kind_n = names[n][0]
            if kind_n != kind_q:
                # match.format is db_name, source_name, field_name -> class_name
                match = ((names[idx][1][0], names[idx][1][1], "_"), names[n][1])
                matchings.append(match)
    et = time.time()
    print("Time to relation-class (name): " + str(et - st))
    return matchings


def __find_relation_class_matchings(self):
    # Retrieve relation names
    st = time.time()
    docs = []
    names = []
    seen_sources = []
    for (_, source_name, _, _) in self.network.iterate_values():
        if source_name not in seen_sources:
            seen_sources.append(source_name)  # seen already
            source_name = source_name.replace('-', ' ')
            source_name = source_name.replace('_', ' ')
            source_name = source_name.lower()
            docs.append(source_name)
            names.append(('relation', source_name))

    # Retrieve class names
    for kr_item, kr_handler in self.kr_handlers.items():
        all_classes = kr_handler.classes()
        for cl in all_classes:
            cl = cl.replace('-', ' ')
            cl = cl.replace('_', ' ')
            cl = cl.lower()
            docs.append(cl)
            names.append(('class', cl))

    tfidf = da.get_tfidf_docs(docs)
    et = time.time()
    print("Time to create docs and TF-IDF: ")
    print("Create docs and TF-IDF: {0}".format(str(et - st)))

    num_features = tfidf.shape[1]
    new_index_engine = LSHRandomProjectionsIndex(num_features, projection_count=7)

    # N2 method
    """
    clean_matchings = []
    for i in range(len(docs)):
        for j in range(len(docs)):
            sparse_row = tfidf.getrow(i)
            dense_row = sparse_row.todense()
            array_i = dense_row.A[0]

            sparse_row = tfidf.getrow(j)
            dense_row = sparse_row.todense()
            array_j = dense_row.A[0]

            sim = np.dot(array_i, array_j.T)
            if sim > 0.5:
                if names[i][0] != names[j][0]:
                    match = names[i][1], names[j][1]
                    clean_matchings.append(match)
    return clean_matchings
    """

    # Index vectors in engine
    st = time.time()

    for idx in range(len(docs)):
        sparse_row = tfidf.getrow(idx)
        dense_row = sparse_row.todense()
        array = dense_row.A[0]
        new_index_engine.index(array, idx)
    et = time.time()
    print("Total index text: " + str((et - st)))

    # Now query for similar ones:
    raw_matchings = defaultdict(list)
    for idx in range(len(docs)):
        sparse_row = tfidf.getrow(idx)
        dense_row = sparse_row.todense()
        array = dense_row.A[0]
        N = new_index_engine.query(array)
        if len(N) > 1:
            for n in N:
                (data, key, value) = n
                raw_matchings[idx].append(key)
    et = time.time()
    print("Find raw matches: {0}".format(str(et - st)))

    # Filter matches so that only relation-class ones appear
    clean_matchings = []
    for key, values in raw_matchings.items():
        key_kind = names[key][0]
        for v in values:
            v_kind = names[v][0]
            if v_kind != key_kind:
                match = (names[key][1], names[v][1])
                clean_matchings.append(match)
    return clean_matchings


def find_sem_coh_matchings(network, kr_handlers):
    matchings = []
    matchings_special = []
    # Get all relations with groups
    table_groups = dict()
    for db, t, attrs in SS.read_table_columns(None, network=network):
        groups = SS.extract_cohesive_groups(t, attrs)
        table_groups[(db, t)] = groups  # (score, [set()])

    names = []
    # Retrieve class names
    for kr_name, kr_handler in kr_handlers.items():
        all_classes = kr_handler.classes()
        for cl in all_classes:
            original_cl_name = cl
            cl = nlp.camelcase_to_snakecase(cl)
            cl = cl.replace('-', ' ')
            cl = cl.replace('_', ' ')
            cl = cl.lower()
            svs = []
            for token in cl.split():
                if token not in stopwords.words('english'):
                    sv = glove_api.get_embedding_for_word(token)
                    if sv is not None:
                        svs.append(sv)
            names.append(('class', (kr_name, original_cl_name), svs))

    for db_table_info, groups in table_groups.items():
        db_name, table_name = db_table_info
        class_seen = []  # to filter out already seen classes
        for g_score, g_tokens in groups:
            g_svs = []
            for t in g_tokens:
                sv = glove_api.get_embedding_for_word(t)
                if sv is not None:
                    g_svs.append(sv)
            for _, class_info, class_svs in names:
                kr_name, class_name = class_info
                sim = SS.compute_semantic_similarity(class_svs, g_svs)
                if sim > g_score and class_name not in class_seen:
                    class_seen.append(class_name)
                    match = ((db_name, table_name, "_"), (kr_name, class_name))
                    matchings.append(match)
                """
                similar = SS.groupwise_semantic_sim(class_svs, g_svs, 0.7)
                if similar:
                    class_seen.append(class_name)
                    match = ((db_name, table_name, "_"), (kr_name, class_name))
                    matchings_special.append(match)
                continue
                """

    return matchings, table_groups #, matchings_special

cutoff_likely_match_threshold = 0.4
min_relevance_score = 0.2
scoring_threshold = 0.4
min_classes = 50


def find_hierarchy_content_fuzzy(kr_handlers, store):
    matchings = []
    # access class names, per hierarchical level (this is one assumption that makes sense)
    for kr_name, kr in kr_handlers.items():
        ch = kr.class_hierarchy
        for ch_name, ch_classes in ch:
            if len(ch_classes) < min_classes:  # do this only for longer hierarchies
                continue
            # query elastic for fuzzy matches
            matching_evidence = defaultdict(int)
            for class_id, class_name in ch_classes:
                matches = store.fuzzy_keyword_match(class_name)
                keys_in_matches = set()
                for m in matches:
                    # record
                    if m.score > min_relevance_score:
                        key = (m.db_name, m.source_name, m.field_name)
                        keys_in_matches.add(key)
                for k in keys_in_matches:
                    matching_evidence[k] += 1
            num_classes = len(ch_classes)
            num_potential_matches = len(matching_evidence.items())
            cutoff_likely_match = float(num_potential_matches/num_classes)
            if cutoff_likely_match > cutoff_likely_match_threshold:  # if passes cutoff threshold then
                continue
            sorted_matching_evidence = sorted(matching_evidence.items(), key=operator.itemgetter(1), reverse=True)
            # a perfect match would score 1
            for key, value in sorted_matching_evidence:
                score = float(value/num_classes)
                if score > scoring_threshold:
                    match = (key, (kr_name, ch_name))
                    matchings.append(match)
                else:
                    break  # orderd, so once one does not comply, no one else does...
    return matchings

if __name__ == "__main__":
    print("Matcher lib")

    st = SimpleTrie()

    sequences = [["a", "b", "c", "d"], ["a", "b", "c", "v"], ["a", "b", "c"], ["a", "b", "c", "lk"]]

    root = st.add_sequences(sequences)

    print(root)


