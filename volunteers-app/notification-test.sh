curl -H "Content-Type: application/json; charset=utf-8" -X POST https://onesignal.com/api/v1/notifications -d '{
  "app_id": "3d5d3aa3-eeda-473f-90dd-62691388f475",
  "include_player_ids": ["806fbac5-64cf-40e2-bad4-7ad8fe5d4e42"],
  "headings": {"en": "אירוע חדש"},
  "contents": {"en": "היי אלן, אתה נדרש בקריאה מסוג פונצ׳ר דרך הנשיאים 45 י-ם. לחץ לפרטים נוספים"},
  "data": {
      "eventId": "-LZZZZLChYsSkP2g_3Qt",
      "event": {
        "details" : {
          "address" : "שלוש השעות 28, בני ברק, ישראל",
          "caller name" : "יוסי",
          "car type" : ".......פתיחת דלת מבחוץ",
          "category" : "Other",
          "geo" : {
            "lat" : 32.0988235,
            "lon" : 34.8343695
          },
          "more" : "רק ללחוץ על הידית",
          "phone number" : "0506016000",
          "private_info" : "יש מעלית עד הגג"
        },
        "dispatcher" : "321",
        "isOpen" : false,
        "key" : "-LZZZZLChYsSkP2g_3Qt",
        "source" : "app",
        "status" : "sent",
        "timestamp" : 1551096759489
      },
      "type": "event"
  },
  "ios_sound": "notification.caf",
  "android_sound": "notification"
}'