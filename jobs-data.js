
// Job Data Generator
// Generates 60 realistic Indian tech jobs

const COMPANIES = [
    "Infosys", "TCS", "Wipro", "Accenture", "Capgemini", "Cognizant", "IBM", "Oracle", "SAP", "Dell",
    "Amazon", "Flipkart", "Swiggy", "Razorpay", "PhonePe", "Paytm", "Zoho", "Freshworks", "Juspay", "CRED",
    "Zerodha", "Groww", "HDFC Bank", "ICICI Bank", "Jio Platforms", "Reliance Retail", "MakeMyTrip", "Zomato",
    "Urban Company", "Meesho"
];

const ROLES = [
    { title: "SDE Intern", exp: "Fresher" },
    { title: "Graduate Engineer Trainee", exp: "Fresher" },
    { title: "Junior Backend Developer", exp: "0-1 Years" },
    { title: "Frontend Intern", exp: "Fresher" },
    { title: "QA Intern", exp: "Fresher" },
    { title: "Data Analyst Intern", exp: "Fresher" },
    { title: "Java Developer", exp: "0-1 Years" },
    { title: "Python Developer", exp: "Fresher" },
    { title: "React Developer", exp: "1-3 Years" },
    { title: "Full Stack Developer", exp: "1-3 Years" },
    { title: "DevOps Engineer", exp: "1-3 Years" },
    { title: "Product Designer", exp: "0-1 Years" }
];

const LOCATIONS = [
    "Bangalore", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Noida", "Mumbai", "Remote"
];

const MODES = ["Onsite", "Hybrid", "Remote"];
const SOURCES = ["LinkedIn", "Naukri", "Indeed", "Instahyre", "Hirist"];

const SALARIES = {
    "Fresher": ["3-5 LPA", "4-6 LPA", "15k-25k/month", "20k-40k/month", "3.6-5 LPA"],
    "0-1 Years": ["4-7 LPA", "5-8 LPA", "6-10 LPA", "5-9 LPA"],
    "1-3 Years": ["8-12 LPA", "10-15 LPA", "12-18 LPA", "10-20 LPA", "7-11 LPA"]
};

// Seeded random helper (simple version for variations)
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDescription(role, company) {
    return `${company} is looking for a talented ${role} to join our dynamic team. 
    You will work on cutting-edge technologies and contribute to scalable products. 
    Key responsibilities include designing, developing, and deploying software solutions. 
    Strong problem-solving skills and a passion for technology are must-haves. 
    This is an excellent opportunity to grow your career in a fast-paced environment.`;
}

function generateJobData() {
    const jobs = [];

    for (let i = 1; i <= 60; i++) {
        const roleObj = randomItem(ROLES);
        const company = randomItem(COMPANIES);
        const location = randomItem(LOCATIONS);
        const mode = location === "Remote" ? "Remote" : randomItem(MODES);
        const salary = randomItem(SALARIES[roleObj.exp] || ["Best in Industry"]);

        jobs.push({
            id: `job-${i}`,
            title: roleObj.title,
            company: company,
            location: location,
            mode: mode,
            experience: roleObj.exp,
            skills: ["Java", "Python", "React", "SQL", "AWS"].sort(() => 0.5 - Math.random()).slice(0, 3),
            source: randomItem(SOURCES),
            postedDaysAgo: Math.floor(Math.random() * 10), // 0 to 9 days ago
            salaryRange: salary,
            applyUrl: `https://www.google.com/search?q=${encodeURIComponent(roleObj.title + " " + company + " jobs")}`,
            description: generateDescription(roleObj.title, company)
        });
    }

    // Sort by postedDaysAgo ascending (newest first)
    return jobs.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
}
