/*
  JavaScript للصفحة التفاعلية:
  - تحديث العنوان
  - إضافة وتعديل العناصر ديناميكيًا
  - تصدير الصفحة مع حماية الكود (منع القائمة السياقية واختصارات الكيبورد)
*/

// متغير لتخزين العنصر الجاري تعديله
let currentEditingElement = null;

// إظهار أو إخفاء حقل الكود البرمجي بناءً على نوع العنصر
document.getElementById("elementType").addEventListener("change", function() {
  if (this.value === "code") {
    document.getElementById("elementCode").style.display = "block";
  } else {
    document.getElementById("elementCode").style.display = "none";
  }
});

// دالة تحديث عنوان الصفحة
function updateTitle() {
  const newTitle = document.getElementById("titleInput").value;
  if (newTitle.trim() === "") {
    alert("الرجاء إدخال عنوان جديد.");
    return;
  }
  document.getElementById("pageTitle").textContent = newTitle;
  alert("تم تحديث عنوان الصفحة.");
}

// دالة مسح كل العناصر المضافة
function clearElements() {
  if (confirm("هل تريد بالتأكيد مسح جميع العناصر؟")) {
    document.getElementById("customElementsContainer").innerHTML = "";
    currentEditingElement = null;
    document.getElementById("addBtn").textContent = "أضف العنصر";
    document.getElementById("cancelEditBtn").style.display = "none";
  }
}

// دالة استخراج معرف الفيديو من رابط يوتيوب
function extractVideoId(url) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

// دالة إضافة عنصر جديد أو تحديث عنصر قائم
function addElement() {
  const type = document.getElementById("elementType").value;
  const text = document.getElementById("elementText").value;
  const url = document.getElementById("elementURL").value;
  const description = document.getElementById("elementDescription").value;
  const codeSnippet = document.getElementById("elementCode").value;

  if (text.trim() === "") {
    alert("الرجاء إدخال نص العنصر.");
    return;
  }

  // إذا كنا في وضع التعديل، نقوم بتحديث العنصر الحالي
  if (currentEditingElement) {
    updateCurrentElement(type, text, url, description, codeSnippet);
    currentEditingElement = null;
    document.getElementById("addBtn").textContent = "أضف العنصر";
    document.getElementById("cancelEditBtn").style.display = "none";
    clearControlInputs();
    return;
  }

  // إنشاء العنصر الجديد
  const container = document.createElement("div");
  container.className = "custom-element";
  container.setAttribute("data-type", type);
  container.setAttribute("data-text", text);
  container.setAttribute("data-url", url);
  container.setAttribute("data-description", description);
  container.setAttribute("data-code", codeSnippet);

  let element;
  if (type === "link") {
    if (url.trim() === "") {
      alert("الرجاء إدخال الرابط.");
      return;
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = extractVideoId(url);
      if (videoId) {
        // إنشاء عنصر لعرض فيديو يوتيوب
        const loadingText = document.createElement("p");
        loadingText.textContent = "جاري جلب بيانات الفيديو...";
        container.appendChild(loadingText);

        // استدعاء YouTube API لجلب بيانات الفيديو
        fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyBXRysdITn_BDUqmijsj_o6A1SnHRiDYqA`)
          .then(response => response.json())
          .then(data => {
            container.removeChild(loadingText);
            if (data.items && data.items.length > 0) {
              const snippet = data.items[0].snippet;
              const videoTitle = snippet.title;
              const titleEl = document.createElement("h3");
              titleEl.textContent = videoTitle;
              container.appendChild(titleEl);

              element = document.createElement("iframe");
              element.src = `https://www.youtube.com/embed/${videoId}`;
              element.allowFullscreen = true;
              container.appendChild(element);

              if (description.trim() !== "") {
                const descElement = document.createElement("p");
                descElement.className = "element-description";
                descElement.textContent = description;
                container.appendChild(descElement);
              }

              const linkButton = document.createElement("a");
              linkButton.href = url;
              linkButton.target = "_blank";
              linkButton.className = "video-btn";
              linkButton.textContent = "مشاهدة على YouTube";
              container.appendChild(linkButton);
              addEditButton(container);
            } else {
              alert("لم يتم العثور على بيانات الفيديو.");
            }
          })
          .catch(error => {
            if(container.contains(loadingText)) {
              container.removeChild(loadingText);
            }
            console.error("Error fetching video data:", error);
            alert("حدث خطأ أثناء جلب بيانات الفيديو.");
          });
      } else {
        alert("معرف الفيديو غير صالح.");
        return;
      }
    } else {
      // إنشاء رابط عادي
      element = document.createElement("a");
      element.href = url;
      element.target = "_blank";
      element.className = "video-link";
      element.title = "رابط جديد";
      element.textContent = text;
      container.appendChild(element);
      if (description.trim() !== "") {
        const descElement = document.createElement("p");
        descElement.className = "element-description";
        descElement.textContent = description;
        container.appendChild(descElement);
      }
      addEditButton(container);
    }
  } else if (type === "button") {
    // إنشاء زر
    element = document.createElement("button");
    element.className = "btn";
    element.textContent = text;
    container.appendChild(element);
    if (description.trim() !== "") {
      const descElement = document.createElement("p");
      descElement.className = "element-description";
      descElement.textContent = description;
      container.appendChild(descElement);
    }
    addEditButton(container);
  } else if (type === "code") {
    // حالة إضافة كود برمجي
    if (codeSnippet.trim() === "") {
      alert("الرجاء إدخال الكود البرمجي.");
      return;
    }
    if (text.trim() !== "") {
      const titleEl = document.createElement("h3");
      titleEl.textContent = text;
      container.appendChild(titleEl);
    }
    const codeBox = document.createElement("pre");
    codeBox.className = "code-box";
    codeBox.textContent = codeSnippet;
    container.appendChild(codeBox);
    if (url.trim() !== "") {
      const linkButton = document.createElement("a");
      linkButton.href = url;
      linkButton.target = "_blank";
      linkButton.className = "video-btn";
      linkButton.textContent = "عرض الرابط";
      container.appendChild(linkButton);
    }
    if (description.trim() !== "") {
      const descElement = document.createElement("p");
      descElement.className = "element-description";
      descElement.textContent = description;
      container.appendChild(descElement);
    }
    addEditButton(container);
  }

  document.getElementById("customElementsContainer").appendChild(container);
  clearControlInputs();
}

// دالة إضافة زر تعديل داخل العنصر
function addEditButton(container) {
  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.textContent = "تعديل";
  editBtn.onclick = function() {
    enterEditMode(container);
  };
  container.appendChild(editBtn);
}

// الدخول إلى وضع التعديل لعنصر معين
function enterEditMode(container) {
  currentEditingElement = container;
  document.getElementById("elementType").value = container.getAttribute("data-type") || "link";
  document.getElementById("elementText").value = container.getAttribute("data-text") || "";
  document.getElementById("elementURL").value = container.getAttribute("data-url") || "";
  document.getElementById("elementDescription").value = container.getAttribute("data-description") || "";
  document.getElementById("elementCode").value = container.getAttribute("data-code") || "";
  if (container.getAttribute("data-type") === "code") {
    document.getElementById("elementCode").style.display = "block";
  } else {
    document.getElementById("elementCode").style.display = "none";
  }
  document.getElementById("addBtn").textContent = "تحديث العنصر";
  document.getElementById("cancelEditBtn").style.display = "inline-block";
}

// تحديث العنصر أثناء وضع التعديل
function updateCurrentElement(type, text, url, description, codeSnippet) {
  currentEditingElement.setAttribute("data-type", type);
  currentEditingElement.setAttribute("data-text", text);
  currentEditingElement.setAttribute("data-url", url);
  currentEditingElement.setAttribute("data-description", description);
  currentEditingElement.setAttribute("data-code", codeSnippet);
  currentEditingElement.innerHTML = "";
  if (type === "link") {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = extractVideoId(url);
      if (videoId) {
        const loadingText = document.createElement("p");
        loadingText.textContent = "جاري جلب بيانات الفيديو...";
        currentEditingElement.appendChild(loadingText);

        fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=YOUR_API_KEY_HERE`)
          .then(response => response.json())
          .then(data => {
            currentEditingElement.removeChild(loadingText);
            if (data.items && data.items.length > 0) {
              const snippet = data.items[0].snippet;
              const videoTitle = snippet.title;
              const titleEl = document.createElement("h3");
              titleEl.textContent = videoTitle;
              currentEditingElement.appendChild(titleEl);

              const iframe = document.createElement("iframe");
              iframe.src = `https://www.youtube.com/embed/${videoId}`;
              iframe.allowFullscreen = true;
              currentEditingElement.appendChild(iframe);

              if (description.trim() !== "") {
                const descElement = document.createElement("p");
                descElement.className = "element-description";
                descElement.textContent = description;
                currentEditingElement.appendChild(descElement);
              }

              const linkButton = document.createElement("a");
              linkButton.href = url;
              linkButton.target = "_blank";
              linkButton.className = "video-btn";
              linkButton.textContent = "مشاهدة على YouTube";
              currentEditingElement.appendChild(linkButton);
              addEditButton(currentEditingElement);
            } else {
              alert("لم يتم العثور على بيانات الفيديو.");
            }
          })
          .catch(error => {
            alert("حدث خطأ أثناء جلب بيانات الفيديو.");
            console.error("Error fetching video data:", error);
          });
      }
    } else {
      const aLink = document.createElement("a");
      aLink.href = url;
      aLink.target = "_blank";
      aLink.className = "video-link";
      aLink.title = "رابط جديد";
      aLink.textContent = text;
      currentEditingElement.appendChild(aLink);
      if (description.trim() !== "") {
        const descElement = document.createElement("p");
        descElement.className = "element-description";
        descElement.textContent = description;
        currentEditingElement.appendChild(descElement);
      }
      addEditButton(currentEditingElement);
    }
  } else if (type === "button") {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = text;
    currentEditingElement.appendChild(btn);
    if (description.trim() !== "") {
      const descElement = document.createElement("p");
      descElement.className = "element-description";
      descElement.textContent = description;
      currentEditingElement.appendChild(descElement);
    }
    addEditButton(currentEditingElement);
  } else if (type === "code") {
    if (text.trim() !== "") {
      const titleEl = document.createElement("h3");
      titleEl.textContent = text;
      currentEditingElement.appendChild(titleEl);
    }
    const codeBox = document.createElement("pre");
    codeBox.className = "code-box";
    codeBox.textContent = codeSnippet;
    currentEditingElement.appendChild(codeBox);
    if (url.trim() !== "") {
      const linkButton = document.createElement("a");
      linkButton.href = url;
      linkButton.target = "_blank";
      linkButton.className = "video-btn";
      linkButton.textContent = "عرض الرابط";
      currentEditingElement.appendChild(linkButton);
    }
    if (description.trim() !== "") {
      const descElement = document.createElement("p");
      descElement.className = "element-description";
      descElement.textContent = description;
      currentEditingElement.appendChild(descElement);
    }
    addEditButton(currentEditingElement);
  }
}

// دالة إلغاء التعديل
function cancelEdit() {
  currentEditingElement = null;
  clearControlInputs();
  document.getElementById("addBtn").textContent = "أضف العنصر";
  document.getElementById("cancelEditBtn").style.display = "none";
}

// دالة مسح مدخلات لوحة التحكم
function clearControlInputs() {
  document.getElementById("elementText").value = "";
  document.getElementById("elementURL").value = "";
  document.getElementById("elementDescription").value = "";
  document.getElementById("elementCode").value = "";
}

/*
  دالة تصدير الصفحة:
  - تنسخ المحتوى المُعد في قسم التصدير.
  - تحذف أزرار التعديل.
  - تبني صفحة HTML جديدة تتضمن حماية الكود (تعطيل القائمة السياقية واختصارات الكيبورد).
  - تُضيف في التذييل رابط يأخذ المستخدم إلى صفحة الدعم.
*/
function exportPage() {
  // استنساخ قسم المحتوى وإزالة أزرار التعديل
  const exportClone = document.getElementById("exportContent").cloneNode(true);
  const editButtons = exportClone.querySelectorAll(".edit-btn");
  editButtons.forEach(btn => btn.remove());

  // الحصول على لون الخلفية واسم الملف
  const bgColor = document.getElementById("bgColor").value;
  let fileName = document.getElementById("exportFileName").value;
  if (fileName.trim() === "") {
    fileName = "exported_page";
  }

  // بناء الصفحة المصدرة مع الحماية:
  // - منع تحديد النص.
  // - تعطيل القائمة السياقية واختصارات الكيبورد (F12، Ctrl+Shift+I/J، Ctrl+U).
  // - تذييل يحتوي على رابط الدعم.
  const exportHTML = `
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.getElementById("pageTitle").textContent}</title>
  <style>
    /* تنسيق الصفحة المصدرة */
    body {
      margin: 0;
      padding: 0;
      font-family: "montserrat", sans-serif;
      background-color: ${bgColor};
      background-image: linear-gradient(125deg, #1E90FF, #008080, #3CB371, #48D1CC, #9370DB, #DDA0DD, #BA55D3, #B22222);
      background-size: 400% 400%;
      animation: bganimation 14s infinite;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      /* منع تحديد النص */
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    @keyframes bganimation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    h1 {
      font-size: 2.8rem;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      margin-bottom: 20px;
      text-align: center;
    }
    #customElementsContainer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      margin-bottom: 30px;
    }
    .custom-element {
      background: rgba(0,0,0,0.6);
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.4);
      padding: 20px;
      margin-bottom: 20px;
      transition: transform 0.3s ease;
    }
    .custom-element:hover {
      transform: scale(1.02);
    }
    .custom-element h3 {
      font-size: 1.4rem;
      color: #fff;
      margin-bottom: 10px;
    }
    .custom-element iframe {
      border: 3px solid #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      width: 100%;
      height: 250px;
    }
    .video-btn {
      margin-top: 10px;
      background: linear-gradient(45deg, #4caf50, #81c784);
      color: #fff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      transition: background 0.3s ease, transform 0.3s ease;
      display: inline-block;
    }
    .video-btn:hover {
      background: #66bb6a;
      transform: translateY(-3px);
    }
    .element-description {
      margin-top: 5px;
      font-size: 1rem;
      color: #fff;
      text-align: center;
    }
    .code-box {
      background: #f5f5f5;
      color: #333;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      width: 100%;
      overflow: auto;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 10px;
      text-align: left;
    }
    footer {
      margin-top: 20px;
      font-size: 0.9rem;
      color: #fff;
      text-align: center;
    }
    footer a {
      color: inherit;
      text-decoration: underline;
    }
  </style>
  <script>
    // منع المستخدم من فتح القائمة السياقية (زر الفأرة الأيمن)
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
    
    // منع اختصارات لوحة المفاتيح التي تتيح عرض الكود المصدّر
    document.onkeydown = function(e) {
      if (e.keyCode == 123) return false;
      if (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) return false;
      if (e.ctrlKey && e.keyCode == 85) return false;
    };
  </script>
</head>
<body oncontextmenu="return false">
  ${exportClone.outerHTML}
  <!-- تذييل الصفحة مع رابط الدعم -->
  <footer>
    <a href="https://t.me/C_T_N_support_bot" target="_blank">جميع الحقوق محفوظة للمالك</a>
  </footer>
</body>
</html>
  `;

  // إنشاء ملف Blob وتحميله
  const blob = new Blob([exportHTML], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName + ".html";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("تم تصدير الصفحة بنجاح!");
}