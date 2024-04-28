function validateAdmin() {
   const admin = localStorage.getItem('admin');
   console.log(admin);  

   // if admin is true then show dashboard and addProducts in the navbar inplace of About and Contact
    if (admin === 'true') {
        // document.getElementById('dashboard').style.display = 'block';
        // document.getElementById('addProducts').style.display = 'block';
        document.getElementById('about').style.display = 'none';
        document.getElementById('contact').style.display = 'none';
        document.getElementById('user-cart').style.display = 'none';
    }

    // if admin is false then show About and Contact in the navbar inplace of dashboard and addProducts
    else {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('addProducts').style.display = 'none';
        document.getElementById('logout').style.display = 'none';
        // document.getElementById('about').style.display = 'block';
        // document.getElementById('contact').style.display = 'block';
    }   
}

function logout() {
    localStorage.removeItem('admin');
    window.location.href = 'index.html';
}

validateAdmin();