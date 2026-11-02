const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'wardro',
  serviceId: 'wardo-ce8d5-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

function ensureUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('EnsureUser', inputVars, inputOpts);
}
exports.ensureUser = ensureUser;

function createWardrobe(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateWardrobe', inputVars, inputOpts);
}
exports.createWardrobe = createWardrobe;

function deleteWardrobe(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('DeleteWardrobe', inputVars, inputOpts);
}
exports.deleteWardrobe = deleteWardrobe;

function createWardrobeItem(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateWardrobeItem', inputVars, inputOpts);
}
exports.createWardrobeItem = createWardrobeItem;

function deleteWardrobeItem(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('DeleteWardrobeItem', inputVars, inputOpts);
}
exports.deleteWardrobeItem = deleteWardrobeItem;

function getMe(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetMe', undefined, inputOpts);
}
exports.getMe = getMe;

function listWardrobes(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListWardrobes', undefined, inputOpts);
}
exports.listWardrobes = listWardrobes;

function listWardrobesWithItems(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListWardrobesWithItems', undefined, inputOpts);
}
exports.listWardrobesWithItems = listWardrobesWithItems;

function getWardrobe(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetWardrobe', inputVars, inputOpts);
}
exports.getWardrobe = getWardrobe;

function getWardrobeItem(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetWardrobeItem', inputVars, inputOpts);
}
exports.getWardrobeItem = getWardrobeItem;

function listWardrobeItems(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListWardrobeItems', undefined, inputOpts);
}
exports.listWardrobeItems = listWardrobeItems;

function listWardrobeItemsByWardrobe(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListWardrobeItemsByWardrobe', inputVars, inputOpts);
}
exports.listWardrobeItemsByWardrobe = listWardrobeItemsByWardrobe;

