/**
 * Dashboard functionality for teacher and parent views
 */

/**
 * Loads teacher courses from Firestore
 * @returns {Promise} Promise resolving with courses
 */
function loadTeacherCourses() {
    const teacherId = fbAuth.currentUser?.uid;
    if (!teacherId) return Promise.reject(new Error('Not logged in'));
    
    return fbDb.collection('courses')
        .where('teacherId', '==', teacherId)
        .get()
        .then(snapshot => {
            const courses = [];
            snapshot.forEach(doc => {
                courses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return courses;
        });
}

/**
 * Loads teacher's students from Firestore
 * @returns {Promise} Promise resolving with students
 */
function loadTeacherStudents() {
    const teacherId = fbAuth.currentUser?.uid;
    if (!teacherId) return Promise.reject(new Error('Not logged in'));
    
    return fbDb.collection('students')
        .where('teacherId', '==', teacherId)
        .get()
        .then(snapshot => {
            const students = [];
            snapshot.forEach(doc => {
                students.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return students;
        });
}

/**
 * Loads parent's children from Firestore
 * @returns {Promise} Promise resolving with children
 */
function loadParentChildren() {
    const parentId = fbAuth.currentUser?.uid;
    if (!parentId) return Promise.reject(new Error('Not logged in'));
    
    return fbDb.collection('children')
        .where('parentId', '==', parentId)
        .get()
        .then(snapshot => {
            const children = [];
            snapshot.forEach(doc => {
                children.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return children;
        });
}

/**
 * Loads admin dashboard data
 * @returns {Promise} Promise resolving with admin data
 */
function loadAdminDashboard() {
    if (!isAdminUser()) return Promise.reject(new Error('Not authorized'));
    
    return Promise.all([
        // Get user counts by role
        fbDb.collection('users').get(),
        // Get course count
        fbDb.collection('courses').get(),
        // Get materials count
        fbDb.collection('materials').get()
    ]).then(([usersSnapshot, coursesSnapshot, materialsSnapshot]) => {
        const users = {
            total: usersSnapshot.size,
            teachers: 0,
            parents: 0
        };
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.role === 'teacher') users.teachers++;
            if (userData.role === 'parent') users.parents++;
        });
        
        return {
            users,
            courses: coursesSnapshot.size,
            materials: materialsSnapshot.size
        };
    });
}

// Make functions available globally
window.loadTeacherCourses = loadTeacherCourses;
window.loadTeacherStudents = loadTeacherStudents;
window.loadParentChildren = loadParentChildren;
window.loadAdminDashboard = loadAdminDashboard;