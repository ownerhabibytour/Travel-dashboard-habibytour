const firebaseConfig = {
    apiKey: "AIzaSyBj-1e9pQ7XADBxt_ko6-nScybee0C1L0Y",
    authDomain: "system-habibytour.firebaseapp.com",
    projectId: "system-habibytour",
    storageBucket: "system-habibytour.appspot.com",

    messagingSenderId: "799067637013",
    appId: "1:799067637013:web:f71bc2d1c8651866da151c",
    measurementId: "G-9Z9Y72R92W"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  function getVal(id) {
    return document.getElementById(id).value.trim();
  }

  // تبويبات
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.getElementById(this.dataset.tab).classList.add('active');
      this.classList.add('active');
      if (this.dataset.tab === 'clientsList') updateClientsList();
      if (this.dataset.tab === 'salesReport') updateSales();
    });
  });

  // إنشاء الحزمة
  async function createPackage() {
    const data = {
      id: Date.now(),
      name: getVal("name"),
      phone: getVal("phone"),
      email: getVal("email"),
      arrival: getVal("arrival"),
      departure: getVal("departure"),
      hotel: getVal("hotel"),
      people: parseInt(getVal("people")),
      accommodation: getVal("accommodation"),
      nationality: getVal("nationality"),
      excursions: Array.from(document.getElementById("excursions").selectedOptions).map(e => e.value),
      price: parseFloat(getVal("price")),
      paymentMethod: getVal("paymentMethod"),
      comment: getVal("comment")
    };

    if (new Date(data.arrival) >= new Date(data.departure)) {
      alert("تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول.");
      return;
    }

    try {
      await db.collection("clients").add(data);
      alert("Package Created and saved to Firebase!");
      document.getElementById("packageForm").reset();
    } catch (error) {
      alert("Error saving data: " + error.message);
      return;
    }

    const text = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
    const qrDataUrl = await QRCode.toDataURL(text);
    await generatePDF(data);

    document.getElementById("whatsappShare").href =
      `https://wa.me/${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    document.getElementById("emailShare").href =
      `mailto:${data.email}?subject=Your Package&body=${encodeURIComponent(text)}`;
  }

  async function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    async function addPageWithBackground(pdf, bgImgUrl, contentCallback) {
      const img = new Image();
      img.src = bgImgUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
      contentCallback();
      pdf.addPage();
    }

    await addPageWithBackground(pdf, 'travel_voucher_bg.jpg', () => {
      pdf.setFontSize(16);
      pdf.text('Travel Voucher', 10, 20);
      pdf.setFontSize(12);
      pdf.text(`Name: ${data.name}`, 10, 30);
      pdf.text(`Phone: ${data.phone}`, 10, 40);
      pdf.text(`Email: ${data.email}`, 10, 50);
      pdf.text(`Arrival: ${data.arrival}`, 10, 60);
      pdf.text(`Departure: ${data.departure}`, 10, 70);
      pdf.text(`Hotel: ${data.hotel}`, 10, 80);
      pdf.text(`People: ${data.people}`, 10, 90);
      pdf.text(`Accommodation: ${data.accommodation}`, 10, 100);
      pdf.text(`Nationality: ${data.nationality}`, 10, 110);
      pdf.text(`Price: $${data.price}`, 10, 120);
      pdf.text(`Payment Method: ${data.paymentMethod}`, 10, 130);
      pdf.text(`Comments: ${data.comment}`, 10, 140);
    });

    await addPageWithBackground(pdf, 'flight_tickets_bg.jpg', () => {
      pdf.setFontSize(16);
      pdf.text('Flight Tickets', 10, 20);
    });

    await addPageWithBackground(pdf, 'hotel_bg.jpg', () => {
      pdf.setFontSize(16);
      pdf.text('Hotel Details', 10, 20);
    });

    for (let excursion of data.excursions) {
      const bgImgUrl = `${excursion.toLowerCase()}_bg.jpg`;
      await addPageWithBackground(pdf, bgImgUrl, () => {
        pdf.setFontSize(16);
        pdf.text(`Excursion: ${excursion}`, 10, 20);
      });
    }

    const excursionBackgrounds = {
  "Safari": "safari_bg.jpg",
  "Parasailing": "parasailing_bg.jpg",
  "Submarine": "submarine_bg.jpg",
  "Bay Dream Yacht": "yacht_bg.jpg",
  "Bedouin Dinner": "bedouin_bg.jpg",
  "Jeep Safari": "jeep_bg.jpg",
  "Banana Boat": "banana_bg.jpg",
  "Camel Ride": "camel_bg.jpg",
  "Giftun Island": "giftun_bg.jpg",
  "Super Safari": "super_safari_bg.jpg",
  "Dolphin Show": "dolphin_bg.jpg",
  "Giza Pyramids": "pyramids_bg.jpg",
  "Egyptian Museum": "museum_bg.jpg",
  "Nile Dinner Cruise": "nile_cruise_bg.jpg",
  "Karnak Temple": "karnak_bg.jpg",
  "Valley of the Kings": "valley_bg.jpg",
  "Hatshepsut Temple": "hatshepsut_bg.jpg",
  "Salt Lakes": "salt_lakes_bg.jpg",
  "Cleopatra Spring": "cleopatra_bg.jpg",
  "Temple of Amun": "amun_bg.jpg",
  "Sharm El Luli": "sharm_luli_bg.jpg",
  "Dolphin House": "dolphin_house_bg.jpg",
  "Desert Safari": "desert_bg.jpg",
  "Qaitbay Citadel": "qaitbay_bg.jpg",
  "Bibliotheca Alexandrina": "library_bg.jpg",
  "Montaza Gardens": "montaza_bg.jpg"
};
pdf.deletePage(pdf.getNumberOfPages());
    pdf.save(`${data.name}_package.pdf`);
  }

  // عرض قائمة العملاء
  function updateClientsList() {
    const table = document.getElementById("clientsTable");
    table.innerHTML = "";

    db.collection("clients").get().then(snapshot => {
      snapshot.forEach(doc => {
        const c = doc.data();
        table.innerHTML += `<tr>
          <td>${c.name}</td><td>${c.email}</td><td>${c.phone}</td>
          <td><button onclick="viewClient('${doc.id}')">View</button></td>
        </tr>`;
      });
    });
  }

  // عرض تفاصيل عميل في نافذة منبثقة
  function viewClient(id) {
    db.collection("clients").doc(id).get().then(doc => {
      if (doc.exists) {
        const c = doc.data();
        const details = Object.entries(c).map(([k, v]) => `${k}: ${v}`).join('\n');
        document.getElementById("modalContent").textContent = details;
        document.getElementById("clientModal").style.display = 'block';
        document.getElementById("overlay").style.display = 'block';
      } else {
        alert("Client not found");
      }
    });
  }

  // إغلاق المودال
  function closeModal() {
    document.getElementById("clientModal").style.display = 'none';
    document.getElementById("overlay").style.display = 'none';
  }

  // عرض تقرير المبيعات
  function updateSales() {
    db.collection("clients").get().then(snapshot => {
      let totalPackages = 0;
      let totalPeople = 0;
      let totalRevenue = 0;

      snapshot.forEach(doc => {
        const c = doc.data();
        totalPackages++;
        totalPeople += c.people || 0;
        totalRevenue += c.price || 0;
      });

      document.getElementById("totalPackages").textContent = totalPackages;
      document.getElementById("totalPeople").textContent = totalPeople;
      document.getElementById("totalRevenue").textContent = '$' + totalRevenue.toFixed(2);
    });
  }