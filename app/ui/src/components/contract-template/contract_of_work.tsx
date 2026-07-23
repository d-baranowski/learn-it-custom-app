import React from "react";

export const getContentHtml = ({
  companyName,
  companyMST,
  companyLocation,
  companyOwner,
  companyOwnerPosition,
  companyOwnerDOB,
  companyOwnerIdentityNumber,
  companyOwnerIdentityCity,
  employeeFullName,
  employeeLocation,
  employeeIdentityNumber,
  employeeIdentityIssueDate,
  employeeIdentityCity,
  employeePosition,
  employeePhoneNumber,
  employeePositionDesc,
  employeeDOB,

}: {
  companyName: string;
  companyMST: string;
  companyLocation: string;
  companyOwner: string;
  companyOwnerPosition: string;
  companyOwnerDOB: string;
  companyOwnerIdentityNumber: string;
  companyOwnerIdentityCity: string;
  employeeFullName: string;
  employeeLocation: string;
  employeeDOB: string;
  employeeIdentityNumber: string;
  employeeIdentityIssueDate: string;
  employeeIdentityCity: string;
  employeePosition: string;
  employeePhoneNumber: string;
  employeePositionDesc: string[];
}): string => `<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>CỘNG H&Ograve;A X&Atilde; HỘI CHỦ NGHĨA VIỆT NAM</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Độc lập &ndash; Tự do &ndash; Hạnh ph&uacute;c</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:right;'><em><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Nam Định, ng&agrave;y 01 th&aacute;ng 12 năm 202</span></em><em><span style='font-size:17px;font-family:"Times New Roman",serif;'>1</span></em></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size:21px;font-family:"Times New Roman",serif;'>HỢP ĐỒNG KHO&Aacute;N C&Ocirc;NG VIỆC</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><em><span style='font-size:21px;font-family:"Times New Roman",serif;'>(Số:&nbsp;</span></em><em><span style='font-size:17px;font-family:"Times New Roman",serif;'>010722/2022/HĐKCV)</span></em></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>B&Ecirc;N THU&Ecirc; KHO&Aacute;N (B&Ecirc;N A): ` + companyName.toUpperCase() + `</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;font-family:"Times New Roman",serif;'>Địa chỉ: ` + companyLocation + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;font-family:"Times New Roman",serif;'>MST: ` + companyMST + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;font-family:"Times New Roman",serif;'>&Ocirc;ng: <strong>`+ companyOwner +`&nbsp; &nbsp;&nbsp;</strong>Chức vụ: ` + companyOwnerPosition + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Sinh ng&agrave;y: ` + companyOwnerDOB + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;font-family:"Times New Roman",serif;'>Số CCCD: ` + companyOwnerIdentityNumber + `&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Ng&agrave;y cấp: 05/06/2017&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Nơi cấp: ` + companyOwnerIdentityCity + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;font-family:"Times New Roman",serif;'>Sau đ&acirc;y gọi l&agrave; &ldquo;C&ocirc;ng ty&rdquo;</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>B&Ecirc;N CHO THU&Ecirc; KHO&Aacute;N (B&Ecirc;N B)&nbsp;</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Họ v&agrave; t&ecirc;n: `+ employeeFullName +`&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Sinh ng&agrave;y: ` + employeeDOB + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Địa chỉ thường tr&uacute;: ` + employeeLocation + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Số CMND: ` + employeeIdentityNumber + `&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Ng&agrave;y cấp: ` + employeeIdentityIssueDate + `&nbsp; &nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;Nơi cấp: ` + employeeIdentityCity + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Số điện thoại: ` + employeePhoneNumber + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>C&ugrave;ng k&yacute; kết hợp đồng giao kho&aacute;n như sau:</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 1</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>: Nội dung c&ocirc;ng việc</span></strong></p>
<div style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'>
    <ul style="margin-bottom:0in;list-style-type: undefined;">
        <li style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>B&ecirc;n B thực hiện c&ocirc;ng việc ` + employeePosition + ` với nội dung : </span></li>
        ${employeePositionDesc
            .map(
              (desc, index) => `
              <li style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>${index + 1}. ${desc}</span></li>
            `
            )
            .join("")}
    </ul>
</div>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 2</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>: Nơi l&agrave;m việc</span></strong></p>
<ul style="list-style-type: undefined;">
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Tại : ` + companyName + `</span></li>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Địa chỉ: ` + companyLocation + `</span></li>
</ul>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 3:</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>&nbsp;Thời gian thực hiện hợp đồng</span></strong></p>
<div style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'>
    <ul style="margin-bottom:0in;list-style-type: undefined;">
        <li style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>B&ecirc;n B thực hiện c&ocirc;ng việc ghi tại Điều 1 kể từ ng&agrave;y k&yacute; HĐ đến khi kết th&uacute;c c&ocirc;ng việc kho&aacute;n.</span></li>
    </ul>
</div>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 4:</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>&nbsp;Thời gian l&agrave;m việc&nbsp;</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Hai b&ecirc;n sẽ thống nhất thực hiện thời gian l&agrave;m việc tuỳ theo t&iacute;nh ch&acirc;t c&ocirc;ng việc.</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Trường hợp c&oacute; thay đổi sẽ c&oacute; th&ocirc;ng b&aacute;o cụ thể sau.</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 5:</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>&nbsp;Lương kho&aacute;n v&agrave; nghĩa vụ thuế</span></strong></p>
<ul>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Tiền lương kho&aacute;n trọn g&oacute;i theo số thời gian l&agrave;m việc cụ thể m&agrave; hai b&ecirc;n đ&atilde; thỏa thuận.</span></li>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Thời hạn trả lương: Mỗi th&aacute;ng theo lịch, hai b&ecirc;n sẽ đ&aacute;nh gi&aacute; chất lượng c&ocirc;ng việc của b&ecirc;n B v&agrave; tiến h&agrave;nh thanh to&aacute;n tiền cho b&ecirc;n B.</span></li>
</ul>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:.25in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Số tiền b&ecirc;n A chi trả cho b&ecirc;n B mỗi th&aacute;ng nếu c&ocirc;ng việc đảm bảo y&ecirc;u cầu gồm:</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:.25in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>+ Tiền lương kho&aacute;n: tiền lương kho&aacute;n trọn g&oacute;i đ&atilde; bao gồm c&aacute;c khoản tiền lương v&agrave; tiền chế độ ch&iacute;nh s&aacute;ch theo quy định của nh&agrave; nước m&agrave; người sử dụng lao động phải nộp cho người lao động.</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:.25in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Trường hợp tr&aacute;ch nhiệm của c&ocirc;ng ty phải nộp hoặc thu hộ để đ&oacute;ng, nộp theo quy định của Nh&agrave; nước th&igrave; c&ocirc;ng ty phải nộp hoặc thu hộ để đ&oacute;ng, nộp theo quy định của Nh&agrave; nước th&igrave; c&ocirc;ng ty sẽ thu lại khoản tiền của người lao động (khoản tiền n&agrave;y l&agrave; tiền của c&ocirc;ng ty phải đ&oacute;ng cho người lao động v&agrave; người lao động phải đ&oacute;ng, nộp cho Nh&agrave; nước theo quy định) để nộp cho nh&agrave; nước&nbsp;</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:.25in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>+ Tiền thưởng v&agrave; c&aacute;c khoản thanh to&aacute;n kh&aacute;c (nếu c&oacute;)</span></p>
<br>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 6:</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>&nbsp;Quyền lợi v&agrave; nghĩa vụ vủa b&ecirc;n A</span></strong></p>
<ul style="list-style-type: disc;">
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Quyền lợi:</span>
        <ul>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Y&ecirc;u cầu b&ecirc;n B thực hiện đ&uacute;ng phần c&ocirc;ng việc đ&atilde; được ghi tại Điều 1, trong thời gian tại Điều 3, Điều 4 của Hợp đồng n&agrave;y</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Y&ecirc;u cầu b&ecirc;n B bồi thường thiệt hại nếu trong qu&aacute; tr&igrave;nh thực hiện c&ocirc;ng việc l&agrave;m hỏng h&oacute;c, thất tho&aacute;t, thiệt hại t&agrave;i sản của b&ecirc;n A</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Chấm dứt hợp đồng trước thời hạn trong trường hợp b&ecirc;n B thường cuy&ecirc;n kh&ocirc;ng ho&agrave;n th&agrave;nh c&ocirc;ng việc, hoặc c&aacute;c trường hợp kh&aacute;c theo quy định của Ph&aacute;p luật</span></li>
        </ul>
    </li>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Nghĩa vụ:&nbsp;</span>
        <ul>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Thanh to&aacute;n đầy đủ số tiền lương kho&aacute;n&nbsp;</span></li>
        </ul>
    </li>
</ul>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 7</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>: Quyền lợi v&agrave; nghĩa vụ của b&ecirc;n B</span></strong></p>
<ul style="list-style-type: disc;">
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Quyền lợi</span>
        <ul>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Được cấp ph&aacute;t c&ocirc;ng cụ cần thiết để hỗ trợ c&ocirc;ng việc</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Được trả lương theo quy định tại Điều 4 khi ho&agrave;n th&agrave;nh c&ocirc;ng việc ghi tại Điều 1 của Hợp đồng n&agrave;y</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Được từ chối l&agrave;m việc khi thấy kh&ocirc;ng an to&agrave;n lao động hoặc kh&ocirc;ng tu&acirc;n thủ quy định của Ph&aacute;p luật</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Chấm dứt hợp đồng theo quy định của Ph&aacute;p luật</span></li>
        </ul>
    </li>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Nghĩa vụ:</span>
        <ul>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Thực hiện đ&uacute;ng c&ocirc;ng việc đ&atilde; ghi tại Điều 1 của Hợp đồng n&agrave;y</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Ho&agrave;n th&agrave;nh v&agrave; đảm bảo chất lượng c&ocirc;ng việc theo lịch ph&acirc;n c&ocirc;ng của Tổ</span></li>
            <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Tu&acirc;n thủ c&aacute;c nội quy, quy định, thỏa ước lao động tập thể của b&ecirc;n A v&agrave; quy định của ph&aacute;p luật trong qu&aacute; tr&igrave;nh thực hiện c&ocirc;ng việc</span></li>
        </ul>
    </li>
</ul>
<p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><strong><u><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>Điều 8:</span></u></strong><strong><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>&nbsp;Điều khoản chung</span></strong></p>
<ul>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Hai b&ecirc;n x&aacute;c nhận việc giao kết hợp đồng l&agrave; ho&agrave;n to&agrave;n tự nguyện, kh&ocirc;ng bị lừa dối hoặc &eacute;p buộc. Hai b&ecirc;n c&oacute; đầy đủ năng lực ph&aacute;p l&yacute; theo quy định của ph&aacute;p luật để k&yacute; kết v&agrave; thực hiện Hợp đồng n&agrave;y</span></li>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Hợp đồng n&agrave;y c&oacute; hiệu lực kể từ ng&agrave;y k&yacute; v&agrave; tự động thanh l&yacute; khi hai b&ecirc;n đ&atilde; ho&agrave;n th&agrave;nh tr&aacute;ch nhiệm với nhau</span></li>
    <li><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>Hợp đồng n&agrave;y được lập th&agrave;nh 02 bản bằng tiếng Việt c&oacute; hiệu lực ph&aacute;p l&yacute; như nhau, mỗi b&ecirc;n giữ 01 bản l&agrave;m căn cứ thực hiện</span></li>
</ul>
<table style="border-collapse: collapse; border: none; width: 100%; margin: 0px auto;">
    <tbody>
        <tr>
            <td style="width: 233.75pt;padding: 0in 5.4pt;vertical-align: top;">
                <p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>&nbsp;</span></strong></p>
                <p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>ĐẠI DIỆN B&Ecirc;N A</span></strong></p>
            </td>
            <td style="width: 233.75pt;padding: 0in 5.4pt;vertical-align: top;">
                <p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>&nbsp;</span></strong></p>
                <p style='margin-top:0in;margin-right:0in;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>ĐẠI DIỆN B&Ecirc;N B</span></strong></p>
            </td>
        </tr>
    </tbody>
</table>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size:17px;line-height:107%;font-family:"Times New Roman",serif;'>&nbsp;</span></p>
<p style='margin-top:6.0pt;margin-right:0in;margin-bottom:6.0pt;margin-left:0in;line-height:normal;font-size:15px;font-family:"Calibri",sans-serif;text-align:justify;'><br></p>`;

const ContentHtml = ({
  data,
}: {
  data: {
    companyName: string;
  companyMST: string;
  companyLocation: string;
  companyOwner: string;
  companyOwnerPosition: string;
  companyOwnerDOB: string;
  companyOwnerIdentityNumber: string;
  companyOwnerIdentityCity: string;
  employeeFullName: string;
  employeeLocation: string;
  employeeDOB: string;
  employeeIdentityNumber: string;
  employeeIdentityIssueDate: string;
  employeeIdentityCity: string;
  employeePosition: string;
  employeePhoneNumber: string;
  employeePositionDesc: string[];
  };
}) => {
  const htmlString = getContentHtml(data);
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
};

export default ContentHtml;
