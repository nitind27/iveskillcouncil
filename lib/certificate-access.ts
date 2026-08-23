import { ROLES } from "./permissions";

/** Institute admin only — print / download certificate PDF */
export function canPrintCertificates(roleId: number) {
  return roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
}

/** Institute admin — approve, reject, issue */
export function canManageCertificateWorkflow(roleId: number) {
  return roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
}

/** Franchise + institute — create certificate requests */
export function canRequestCertificates(roleId: number) {
  return (
    roleId === ROLES.SUPER_ADMIN ||
    roleId === ROLES.ADMIN ||
    roleId === ROLES.SUB_ADMIN
  );
}

/** View request list (status only for franchise; full for institute) */
export function canViewCertificateRequests(roleId: number) {
  return canRequestCertificates(roleId);
}
