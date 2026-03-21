// Role IDs from database
export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  SUB_ADMIN: 3,
  STUDENT: 4,
  STAFF: 5,
} as const;

// Role-based menu filtering
export function filterMenuByRole(menuSections: any[], roleId: number, franchiseId?: string) {
  return menuSections.map((section) => {
    const filteredItems = section.items.filter((item: any) => {
      // Super Admin & Admin (Institute Admin) - Full access, same functionality
      if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) {
        return true;
      }

      // Sub Admin (Franchise Owner) - Limited to their franchise
      if (roleId === ROLES.SUB_ADMIN) {
        // Hide subscription and franchise management
        if (section.id === 'subscription' || item.id === 'franchises') {
          return false;
        }
        // Hide user management
        if (item.id === 'users') {
          return false;
        }
        return true;
      }

      // Student - Very limited access
      if (roleId === ROLES.STUDENT) {
        // Only show dashboard and their own data
        if (item.id === 'dashboard' || item.id === 'analytics') {
          return true;
        }
        // Hide most management sections
        if (['subscription', 'academics', 'attendance', 'certificates', 'staff', 'communication', 'system'].includes(section.id)) {
          return false;
        }
        return false;
      }

      // Staff - Limited access
      if (roleId === ROLES.STAFF) {
        // Similar to Sub Admin but more restricted
        if (section.id === 'subscription' || item.id === 'franchises' || item.id === 'users') {
          return false;
        }
        return true;
      }

      return false;
    });

    return {
      ...section,
      items: filteredItems,
    };
  }).filter((section) => section.items.length > 0);
}

