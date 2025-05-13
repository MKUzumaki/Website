let menuIcon = document.querySelector("#menu-icon");
let navbar = document.querySelector(".navbar");
let sections = document.querySelectorAll("section");
let navLinks = document.querySelectorAll("header nav a");

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height =sec.offsetHeight;
        let id = sec.getAttribute("id");

        if(top >= offset && top < offset + height){
            navLinks.forEach(links => {
                links.classList.remove("active");
                document.querySelector("header nav a [href*=" + id + " ]").classList.add('active')
            })
        }
    })
}
menuIcon.onclick = () => {
    menuIcon.classList.toggle("bx-x");
    navbar.classList.toggle("active");
}
document.getElementById('hireBtn').addEventListener('click', function(e) {
  e.preventDefault();

  // Let the user choose:
  const choice = prompt(
    "How would you like to send your message?\n\n" +
    "1: Use my mail client (default)\n" +
    "2: Use Gmail in browser\n\n" +
    "Type 1 or 2, then OK."
  );

  if (choice === '2') {
    // Web-mail: Gmail compose
    window.open(
      'https://mail.google.com/mail/?view=cm&fs=1' +
      '&to=makara.chan@mail.fr' +
      '&su=' + encodeURIComponent('Hiring Inquiry'),
      '_blank', 'noopener'
    );
  } else {
    // Default: launch local mail client
    window.location.href =
      'mailto:makara.chan@mail.fr' +
      '?subject=' + encodeURIComponent('Hiring Inquiry');
  }
});