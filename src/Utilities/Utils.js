class Utils {
    constructor() {
        // constructor body
        // generally, utility classes do not have constructors
        // as they usually contain static methods
    }

    // Example utility method
    static toUpperCase(str) {
        return str.toUpperCase();
    }

    // Another example utility method
    static toLowerCase(str) {
        return str.toLowerCase();
    }

    // Another example utility method
    static capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Add your own utility methods...

}

module.exports = Utils;
