import React from "react";

export const getContentHtml = ({
  companyName,
  companyMST,
  companyLocation,
  companyOwner,
  companyOwnerNationality,
  companyOwnerPosition,
  companyOwnerDOB,
  companyOwnerIdentityNumber,
  companyOwnerIdentityIssueDate,
  companyOwnerIdentityCity,
  employeeFullName,
  employeeNationality,
  employeeDOB,
  employeeBirthLocation,
  employeeLocation,
  employeeIdentityNumber,
  employeeIdentityIssueDate,
  employeeIdentityCity,
  employeePosition,
  totalTrainingTime,
  StartDate,
  EndDate
}: {
  companyName: string;
  companyMST: string;
  companyLocation: string;
  companyLocationGroup: string;
  companyPhoneNumber: string;
  companyOwner: string;
  companyOwnerNationality: string;
  companyOwnerPosition: string;
  companyOwnerDOB: string;
  companyOwnerIdentityNumber: string;
  companyOwnerIdentityIssueDate: string;
  companyOwnerIdentityCity: string;
  companyOwnerDOBLocation: string;
  employeeFullName: string;
  employeeNationality: string;
  employeeDOB: string;
  employeeBirthLocation: string;
  employeeLocation: string;
  employeeIdentityNumber: string;
  employeeIdentityIssueDate: string;
  employeeIdentityCity: string;
  employeePosition: string;
  totalTrainingTime: string;
  StartDate: string;
  EndDate: string;
}): string => `<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size: 17px; line-height: 107%; font-family: "Times New Roman", Times, serif;'>CỘNG H&Ograve;A X&Atilde; HỘI CHỦ NGHĨA VIỆT NAM</span></strong></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><span style="font-size: 17px; line-height: 107%;">Độc lập &ndash; Tự do &ndash; Hạnh ph&uacute;c</span></strong></span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><span style="font-size: 11px; line-height: 107%;">&nbsp;</span></strong></span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><span style="font-size: 20px; line-height: 107%;">HỢP ĐỒNG Đ&Agrave;O TẠO NGHỀ</span></strong></span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><span style="font-size: 11px; line-height: 107%;">&nbsp;</span></strong></span></p>
<ul style="list-style-type: undefined;">
    <li style='font-family: "Times New Roman", Times, serif;'><em><span style="line-height: 107%; font-size: 17px;">Căn cứ điều 61 - Bộ luật Lao động số 45/2019/QH14 ng&agrave;y 20/11/2019 của Quốc hội nước CHXHCN Việt Nam;</span></em></li>
    <li style='font-family: "Times New Roman", Times, serif;'><em><span style="line-height: 107%; font-size: 17px;">Căn cứ Quy chế đ&agrave;o tạo của C&ocirc;ng ty ` + companyName + `</span></em></li>
    <li style='font-family: "Times New Roman", Times, serif;'><em><span style="line-height: 107%; font-size: 17px;">Căn cứ nhu cầu v&agrave; thỏa thuận của hai b&ecirc;n;</span></em></li>
</ul>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Ch&uacute;ng t&ocirc;i, một b&ecirc;n l&agrave; &Ocirc;ng (B&agrave;): ` + companyOwner + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Quốc tịch: ` + companyOwnerNationality + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Sinh ng&agrave;y: ` + companyOwnerDOB + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; Chức vụ: &nbsp; ` + companyOwnerPosition+ `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Số CMND/CCCD: ` + companyOwnerIdentityNumber + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Cấp ng&agrave;y: ` + companyOwnerIdentityIssueDate + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Nơi cấp: ` + companyOwnerIdentityCity+ `&nbsp;</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Đại diện cho: C&ocirc;ng Ty ` + companyName + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Địa chỉ: `+ companyLocation +`</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>MST: ` + companyMST + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>V&agrave; một b&ecirc;n l&agrave; &ocirc;ng (b&agrave;): ` + employeeFullName + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Quốc tịch: `+ employeeNationality +`</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Sinh ng&agrave;y: ` + employeeDOB + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Tại: ` + employeeBirthLocation + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Địa chỉ thường tr&uacute;: ` + employeeLocation + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Số CMND/CCCD: ` + employeeIdentityNumber + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>Cấp ng&agrave;y: ` + employeeIdentityIssueDate + ` &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp; &nbsp; Tại: ` + employeeIdentityCity + `</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>C&ugrave;ng nhau thỏa thuận k&yacute; kết Hợp đồng đ&agrave;o tạo nghề v&agrave; cam kết đ&uacute;ng những điều khoản sau đ&acirc;y:</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><u><span style="font-size: 17px;">Điều 1:</span></u></strong><strong><span style="font-size: 17px;">&nbsp;Thời hạn v&agrave; c&ocirc;ng việc hợp đồng</span></strong></span></p>
<ul style="list-style-type: undefined;">
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Loại hợp đồng: Hợp đồng đ&agrave;o tạo nghề</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Nghề đ&agrave;o tạo: ` + employeePosition + `</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Thời hạn đ&agrave;o tạo: ` + totalTrainingTime + ` Th&aacute;ng</span></li>
</ul>
<ul style="list-style-type: undefined margin-left: 4.199999999999999px;">
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Từ ng&agrave;y : ` + StartDate + ` đến ng&agrave;y : ` + EndDate + `</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Địa điểm đ&agrave;o tạo: Tại C&ocirc;ng ty Cổ phần SXKD- XNK NT Vụ Bản</span></li>
</ul>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><u><span style="font-size: 17px;">Điều 2:</span></u></strong><strong><span style="font-size: 17px;">&nbsp;Chế độ đ&agrave;o tạo nghề</span></strong></span></p>
<ol style="list-style-type: decimal;">
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Thời gian học trong ng&agrave;y:&nbsp;</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">S&aacute;ng từ: 7h30 đến 11h30</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="font-size: 17px;">Chiều từ: 12h30 đến 17h30</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Nghỉ c&aacute;c ng&agrave;y chủ nhật v&agrave; tất cả c&aacute;c ng&agrave;y Lễ Tết theo quy định của Nh&agrave; nước&nbsp;</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Học vi&ecirc;n được cấp ph&aacute;t:</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Thẻ học vi&ecirc;n</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">T&agrave;i liệu học tập</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Người học được học trong điều kiện an to&agrave;n v&agrave; vệ sinh theo quy định hiện h&agrave;nh của Nh&agrave; nước</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">C&ocirc;ng ty hỗ trợ to&agrave;n bộ chi ph&iacute; đ&agrave;o tạo, vật tư nguy&ecirc;n phụ liệu phục vụ cho đ&agrave;o tạo</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Trong thời gian đ&agrave;o tạo h&agrave;ng th&aacute;ng được hưởng tiền của những sản phẩm đạt y&ecirc;u cầu do m&igrave;nh l&agrave;m ra .</span></li>
</ol>
<br>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:115%;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><u><span style="font-size: 17px; line-height: 115%;">Điều 3:</span></u></strong><strong><span style="font-size: 17px; line-height: 115%;">&nbsp;Thời hạn người lao động cam kết phải l&agrave;m việc cho người sử dụng lao động sau khi được đ&agrave;o tạo</span></strong></span></p>
<p style='margin-top:6.0pt;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:21.3pt;'><span style='font-size: 17px; line-height: 107%; font-family: "Times New Roman", Times, serif;'>Sau khi kết th&uacute;c đ&agrave;o tạo khi người lao động đ&aacute;p ứng được y&ecirc;u cầu c&ocirc;ng việc th&igrave; phải l&agrave;m việc cho c&ocirc;ng ty &iacute;t nhất l&agrave; 01năm. Nếu trong thời hạn 01 năm người lao động tự &yacute; nghỉ việc th&igrave; phải bồi thường chi ph&iacute; đ&agrave;o tạo cho c&ocirc;ng ty. &nbsp;&nbsp;</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:21.3pt;line-height:115%;'><span style='font-size: 17px; line-height: 115%; font-family: "Times New Roman", Times, serif;'>Hết thời hạn đ&agrave;o tạo m&agrave; người lao động vẫn chưa đạt c&oacute; thể thỏa thuận đ&agrave;o tạo tiếp. Trong trường hợp hai b&ecirc;n kh&ocirc;ng c&oacute; &yacute; kiến g&igrave; kh&aacute;c, hợp đồng đ&agrave;o tạo n&agrave;y sẽ k&eacute;o d&agrave;i th&ecirc;m một kỳ hạn nữa m&agrave; kh&ocirc;ng cần k&yacute; lại.</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:115%;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><u><span style="font-size: 17px; line-height: 115%;">Điều 4:</span></u></strong><strong><span style="font-size: 17px; line-height: 115%;">&nbsp;Nghĩa vụ, quyền hạn v&agrave; quyền lợi của người học nghề</span></strong></span></p>
<ol style="list-style-type: decimal;">
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Nghĩa vụ:</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Người học nghề phải l&agrave;m đầy đủ thủ tục theo quy định mới được v&agrave;o học</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Trong thời gian học nghề tuyệt đối chấp h&agrave;nh nội quy, kỷ luật của c&ocirc;ng ty v&agrave; ph&aacute;p luật của nh&agrave; nước&nbsp;</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Người học nghề phải ho&agrave;n to&agrave;n chịu tr&aacute;ch nhiệm trước BLĐ c&ocirc;ng ty v&agrave; ph&aacute;p luật nh&agrave; nước về những h&agrave;nh vi, lỗi của m&igrave;nh g&acirc;y ra đồng thời phải bồi thường to&agrave;n bộ chi ph&iacute; đ&agrave;o tạo nghề khi kh&ocirc;ng thực hiện đ&uacute;ng cam kết l&agrave;m việc tại c&ocirc;ng ty</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Quyền hạn:</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Người học c&oacute; quyền đề xuất, đ&oacute;ng g&oacute;p &yacute; kiến x&acirc;y dựng để đảm bảo quyền lợi cho m&igrave;nh v&agrave; x&acirc;y dựng c&ocirc;ng ty ng&agrave;y c&agrave;ng ph&aacute;t triển</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Quyền lợi:</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Người học được hướng dẫn thực h&agrave;nh nghề theo m&ocirc; h&igrave;nh sản xuất của c&ocirc;ng ty</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Trong thời gian đ&agrave;o tạo, người học việc được hưởng chế độ hỗ trợ theo quy định tại từng thời điểm của c&ocirc;ng ty</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Người học được đ&agrave;o tạo mọi c&ocirc;ng đoạn trong qu&aacute; tr&igrave;nh sản xuất</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Hết thời gian đ&agrave;o tạo h&agrave;ng ng&agrave;y người lao động c&oacute; quyền tham gia sản xuất theo c&ocirc;ng ty. C&ocirc;ng ty sẽ trả lương theo quy định cho người lao động&nbsp;</span></li>
</ol>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:115%;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><u><span style="font-size: 17px; line-height: 115%;">Điều 5:</span></u></strong><strong><span style="font-size: 17px; line-height: 115%;">&nbsp;Nghĩa vụ v&agrave; quyền hạn của b&ecirc;n dạy nghề</span></strong></span></p>
<ol style="list-style-type: decimal;">
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Nghĩa vụ</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Thực hiện đầy đủ những điều kiện cần thiết đ&atilde; cam kết trong hợp đồng đ&agrave;o tạo nghề để người học học tập đạt hiệu quả, bảo đảm theo hợp đồng đ&atilde; k&yacute;</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">C&ocirc;ng ty cam kết sau khi đ&agrave;o tạo hết thời gian quy định, người lao động đạt y&ecirc;u cầu đ&agrave;o tạo sẽ được nhận v&agrave;o l&agrave;m việc ch&iacute;nh thức tại c&ocirc;ng ty</span></li>
    <li style='font-family: "Times New Roman", Times, serif;'><span style="line-height: 115%; font-size: 17px;">Quyền hạn</span></li>
</ol>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:.5in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:115%;'><span style='font-size: 17px; line-height: 115%; font-family: "Times New Roman", Times, serif;'>C&ocirc;ng ty c&oacute; quyền thay đổi, tạm ho&atilde;n, kỷ luật v&agrave; chấm dứt hợp đồng đ&agrave;o tạo với c&aacute;c trường hợp người học vi phạm hợp đồng theo quy định của ph&aacute;p luật</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><u><span style="font-size: 17px; line-height: 107%;">Điều 6:</span></u></strong><strong><span style="font-size: 17px; line-height: 107%;">&nbsp;Điều khoản thi h&agrave;nh</span></strong></span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size: 17px; line-height: 107%; font-family: "Times New Roman", Times, serif;'>Hết thời hạn học nghề, hai b&ecirc;n k&yacute; hợp đồng lao động khi đủ c&aacute;c điều kiện quy định tại Bộ luật Lao động</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size: 17px; line-height: 107%; font-family: "Times New Roman", Times, serif;'>Hợp đồng đ&agrave;o tạo nghề được l&agrave;m tại C&ocirc;ng ty ` + companyName + ` v&agrave; được lập th&agrave;nh 02 bản mỗi b&ecirc;n giữ 01 bản c&oacute; gi&aacute; trị ph&aacute;p l&yacute; như nhau v&agrave; c&oacute; hiệu lực kể từ ng&agrave;y `+ new Date().getDate().toString() +` th&aacute;ng `+ new Date().getMonth().toString() +` năm `+ new Date().getFullYear().toString() +`</span></p>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size: 17px; line-height: 107%; font-family: "Times New Roman", Times, serif;'>&nbsp;</span></p>
<div align="center" style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'>
    <table style="border-collapse: collapse;border: none;width: 624px;">
        <tbody>
            <tr>
                 <td style="width: 253.45pt;padding: 0in 5.4pt;vertical-align: top;">
                    <p style='margin-top:6.0pt;margin-right:0in;margin-bottom:    6.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><span style="font-size: 17px;">NGƯỜI LAO ĐỘNG</span></strong></span></p>
                    <p style='margin-top:6.0pt;margin-right:0in;margin-bottom:    6.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>(K&yacute; t&ecirc;n/ Ghi r&otilde; họ t&ecirc;n)</span></p>
                </td>
                <td style="width: 253.45pt;padding: 0in 5.4pt;vertical-align: top;">
                    <p style='margin-top:6.0pt;margin-right:0in;margin-bottom:    6.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style="font-family: 'Times New Roman', Times, serif;"><strong><span style="font-size: 17px;">NGƯỜI SỬ DUNG LAO ĐỘNG</span></strong></span></p>
                    <p style='margin-top:6.0pt;margin-right:0in;margin-bottom:    6.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;line-height:normal;'><span style='font-size: 17px; font-family: "Times New Roman", Times, serif;'>&nbsp; &nbsp; &nbsp; &nbsp;(K&yacute; t&ecirc;n/ Ghi r&otilde; họ t&ecirc;n)</span></p>
                </td>
            </tr>
        </tbody>
    </table>
</div>
<p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;'><span style='font-size: 17px; line-height: 107%; font-family: "Times New Roman", Times, serif;'>&nbsp;</span></p>`;

const ContentHtml = ({
  data,
}: {
  data: {
    companyName: string;
    companyMST: string;
    companyLocation: string;
    companyLocationGroup: string;
    companyPhoneNumber: string;
    companyOwner: string;
    companyOwnerNationality: string;
    companyOwnerPosition: string;
    companyOwnerDOB: string;
    companyOwnerIdentityNumber: string;
    companyOwnerIdentityIssueDate: string;
    companyOwnerIdentityCity: string;
    companyOwnerDOBLocation: string;
    employeeFullName: string;
    employeeNationality: string;
    employeeDOB: string;
    employeeBirthLocation: string;
    employeeLocation: string;
    employeeIdentityNumber: string;
    employeeIdentityIssueDate: string;
    employeeIdentityCity: string;
    employeePosition: string;
    totalTrainingTime: string;
    StartDate: string;
    EndDate: string;
  };
}) => {
  const htmlString = getContentHtml(data);
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
};

export default ContentHtml;
