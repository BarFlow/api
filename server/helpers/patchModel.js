const updateDocument = function updateDocument(doc, SchemaTarget, data) {
  for (const field in SchemaTarget.schema.paths) {  //eslint-disable-line
    if ((field !== '_id') && (field !== '__v')) {
      const newValue = getObjValue(field, data);
      if (newValue !== undefined) {
        setObjValue(field, doc, newValue);
      }
    }
  }
  return doc;
};

function getObjValue(field, data) {
  return field.split('.').reduce((obj, f) => { //eslint-disable-line
    if (obj) return obj[f];
  }, data);
}

function setObjValue(field, data, value) {
  const fieldArr = field.split('.');
  return fieldArr.reduce((o, f, i) => {
    if (i === fieldArr.length - 1) {
      o[f] = value; // eslint-disable-line
    } else {
      if (!o[f]) o[f] = {}; // eslint-disable-line
    }
    return o[f];
  }, data);
}

export default updateDocument;
