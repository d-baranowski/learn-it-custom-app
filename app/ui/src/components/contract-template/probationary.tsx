import React from "react";

export const getContentHtml = ({
  companyName,
  companyNameShort,
  companyLocation,
  companyMST,
  companyPhoneNumber,
  companyOwner,
  companyOwnerNationality,
  companyOwnerPosition,
  companyOwnerDOB,
  employeeFullName,
  employeeNationality,
  employeeDOB,
  employeeBirthLocation,
  employeeLocation,
  employeeIdentityNumber,
  employeeIdentityIssueDate,
  employeeIdentityCity,
  employeePosition,
  employeePositionDesc,
  employeeSalary,
  StartDate,
  EndDate,
  TimeTrial
}: {
  companyName: string;
  companyNameShort: string;
  companyLocation: string;
  companyMST: string;
  companyPhoneNumber: string;
  companyOwner: string;
  companyOwnerNationality: string;
  companyOwnerPosition: string;
  companyOwnerDOB: string;
  employeeFullName: string;
  employeeNationality: string;
  employeeDOB: string;
  employeeBirthLocation: string;
  employeeLocation: string;
  employeeIdentityNumber: string;
  employeeIdentityIssueDate: string;
  employeeIdentityCity: string;
  employeePosition: string;
  employeePositionDesc: string[];
  employeeSalary: string;
  StartDate: string;
  EndDate: string;
  TimeTrial: string;
}): string => `
<table style="width: 100%;">
<tbody>
<tr>
<td style="text-align: center; vertical-align: top; width: 50%;">
<p style="font-family:Times New Roman;"><strong>` + companyNameShort.toLocaleUpperCase() + `</strong></p>
</td>
<td style="text-align: center; width: 50%;">
<p style="font-family:Times New Roman;"><strong>CỘNG H&Ograve;A X&Atilde; HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
<p style="font-family:Times New Roman;"><strong>Độc l&acirc;p &ndash; Tự do &ndash; Hạnh ph&uacute;c</strong></p>
<p style="font-family:Times New Roman;"><strong>-------&amp;-------</strong></p>
<p style="font-family:Times New Roman;"><em>Nam Định, ng&agrave;y 01 th&aacute;ng 04 năm 2022</em></p>
</td>
</tr>
</tbody>
</table>
<p style="text-align: center; font-family:Times New Roman;"><strong>HỢP ĐỒNG THỬ VIỆC</strong></p>
<p style="text-align: center; font-family:Times New Roman;">(Số HĐTV: &hellip;&hellip;&hellip;/2022/HĐTV)</p>
<p>&nbsp;</p>
<p style="font-family:Times New Roman;"><strong>Một b&ecirc;n l&agrave; &Ocirc;ng/ b&agrave;:</strong>&nbsp; <strong>` + companyOwner + `</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Quốc tịch:</strong> ` + companyOwnerNationality + `</p>
<p style="font-family:Times New Roman;">Sinh ngày: ` + companyOwnerDOB + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Chức vụ: ` + companyOwnerPosition + `</p>
<p style="font-family:Times New Roman;">Đại diện cho: <strong>` + companyName + `</strong></p>
<p style="font-family:Times New Roman;">Địa chỉ: ` + companyLocation + `</p>
<p style="font-family:Times New Roman;">MST: ` + companyMST + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Điện thoại: ` + companyPhoneNumber + `</p>
<p style="font-family:Times New Roman;">(Sau đ&acirc;y được gọi l&agrave; &ldquo;<strong>Người sử dụng lao động</strong>&rdquo;)</p>
<p style="font-family:Times New Roman;"><strong>V&agrave; một b&ecirc;n l&agrave; &ocirc;ng (b&agrave;): ` + employeeFullName + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Quốc tịch:</strong> ` + employeeNationality + `</p>
<p style="font-family:Times New Roman;">Sinh ng&agrave;y: ` + employeeDOB + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tại: ` + employeeBirthLocation + `</p>
<p style="font-family:Times New Roman;">Địa chỉ thường tr&uacute;: ` + employeeLocation +`</p>
<p style="font-family:Times New Roman;">Số CMND/CCCD: ` + employeeIdentityNumber + ` &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Cấp ng&agrave;y:` + employeeIdentityIssueDate + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tại: ` + employeeIdentityCity + `</p>
<p style="font-family:Times New Roman;">(Sau đ&acirc;y được gọi l&agrave; &ldquo;<strong>Người lao động</strong>&rdquo;)</p>
<p style="font-family:Times New Roman;"><strong><em>C&ugrave;ng nhau thỏa thuận thống nhất k&yacute; kết Hợp đồng thử vi&ecirc;̣c v&agrave; cam kết thực hiện đ&uacute;ng c&aacute;c điều khoản sau:</em></strong></p>
<p style="font-family:Times New Roman;"><strong><u>Điều 1</u></strong>:&nbsp;<strong>Thời hạn v&agrave; c&ocirc;ng việc hợp đồng :</strong></p>
<ul>
<li style="font-family:Times New Roman;">Loại Hợp đồng: Hợp đồng thử việc `+ TimeTrial +` ng&agrave;y.</li>
<li style="font-family:Times New Roman;">Từ ng&agrave;y ` + StartDate + ` đến ng&agrave;y ` + EndDate + `</li>
<li style="font-family:Times New Roman;">Địa điểm làm vi&ecirc;̣c: &nbsp;` + companyLocation + `</li>
<li style="font-family:Times New Roman;">Chức danh chuy&ecirc;n m&ocirc;n : <strong>&nbsp;</strong>` + employeePosition + `</li>
<li style="font-family:Times New Roman;">Bước c&ocirc;ng việc phải l&agrave;m : &nbsp;</li>
<ul>
 ${employeePositionDesc
            .map(
              (desc, index) => `
              <li style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;'><span style='line-height:107%;font-family:"Times New Roman",serif;font-size:17px;'>${index + 1}. ${desc}</span></li>
            `
            )
            .join("")}
</ul>
</ul>
<p style="font-family:Times New Roman;"><strong><u>Điều 2</u></strong>:&nbsp;<strong>Thời giờ làm vi&ecirc;̣c, thời giờ nghỉ ngơi</strong></p>
<p style="font-family:Times New Roman;padding-left: 30px;">2.1. Thời giờ l&agrave;m việc:&nbsp;</p>
<ul>
<li style="font-family:Times New Roman;">Trong ng&agrave;y: 08 giờ/ng&agrave;y, 48 giờ / tuần.
<ul>
<li style="font-family:Times New Roman;">S&aacute;ng từ : 7<sup>h </sup>30 đến 11<sup>h</sup>30</li>
<li style="font-family:Times New Roman;">Chiều từ: 12<sup>h </sup>30 đến 16<sup>h</sup> 30</li>
</ul>
</li>
<li style="font-family:Times New Roman;">Thời giờ l&agrave;m th&ecirc;m: Làm th&ecirc;m theo sự sắp xếp của Người sử dụng lao động nhưng được th&ocirc;ng b&aacute;o trước v&agrave; c&oacute; sự chấp thuận của Người lao động. Giờ l&agrave;m th&ecirc;m kh&ocirc;ng quá 4 giờ/ng&agrave;y, 30 giờ/th&aacute;ng v&agrave; 300 giờ/ năm.</li>
</ul>
<br>
<p style="font-family:Times New Roman;padding-left: 30px;">2.2. Thời giờ nghỉ ngơi:</p>
<ul>
<li style="font-family:Times New Roman;">Thời gian nghỉ trưa từ 11 giờ 30 ph&uacute;t đến 12 giờ 30 ph&uacute;t h&agrave;ng ng&agrave;y.</li>
<li style="font-family:Times New Roman;">Thời gian nghỉ h&agrave;ng tuần, ph&eacute;p, lễ, tết : Theo quy định của luật lao động.</li>
</ul>
<p style="font-family:Times New Roman;"><strong><u>Điều 3:</u></strong>&nbsp;<strong>Nghĩa vụ v&agrave; c&aacute;c quyền lợi của người lao động:</strong></p>
<ol>
<li style="font-family:Times New Roman;">Quyền lợi:</li>
</ol>
<ul>
<li style="font-family:Times New Roman;">Mức lương c&ocirc;ng việc : <strong>` + employeeSalary + `</strong> đồng/th&aacute;ng. Mức lương thử việc: thấp nhất bằng 85% mức lương c&ocirc;ng việc.</li>
<li style="font-family:Times New Roman;">H&igrave;nh thức trả lương : Trả bằng tiền mặt hoặc thẻ ATM.</li>
<li style="font-family:Times New Roman;">Thời gian trả lương : 01 lần v&agrave;o ng&agrave;y 15 h&agrave;ng th&aacute;ng;</li>
<li style="font-family:Times New Roman;">Phương tiện đi lại l&agrave;m việc:&nbsp;C&aacute; nh&acirc;n tự t&uacute;c.</li>
<li style="font-family:Times New Roman;">Được hỗ trợ tiền cơm ca</li>
<li style="font-family:Times New Roman;">Được cấp ph&aacute;t những dụng cụ để l&agrave;m việc : Theo qui định của c&ocirc;ng ty.</li>
<li style="font-family:Times New Roman;">Điều kiện An to&agrave;n - Vệ sinh lao động : Theo quy định hiện h&agrave;nh của ph&aacute;p luật.</li>
<li style="font-family:Times New Roman;">Được đề nghị tham gia c&aacute;c phong tr&agrave;o của c&ocirc;ng ty.</li>
<li style="font-family:Times New Roman;">Những thoả thuận kh&aacute;c: Trong v&ograve;ng 15 ng&agrave;y (l&agrave;m việc) kể từ ng&agrave;y k&yacute; kết hợp đồng thử việc n&agrave;y, v&igrave; bất cứ l&yacute; do g&igrave; m&agrave; người lao động kh&ocirc;ng tiếp tục cộng t&aacute;c với c&ocirc;ng ty (kể cả trong trường hợp c&ocirc;ng ty th&ocirc;ng b&aacute;o chấm dứt hợp đồng thử việc trước thời hạn) th&igrave; người lao động cam kết sẽ kh&ocirc;ng y&ecirc;u cầu c&ocirc;ng ty phải thanh to&aacute;n bất cứ chế độ v&agrave; quyền lợi n&agrave;o của người lao động trong thời gian n&ecirc;u tr&ecirc;n.</li>
</ul>
<ol start="2">
<li style="font-family:Times New Roman;">Nghĩa vụ:</li>
</ol>
<ul>
<li style="font-family:Times New Roman;">Phải ho&agrave;n th&agrave;nh c&ocirc;ng việc được giao theo năng lực v&agrave; y&ecirc;u cầu của vị tr&iacute; c&ocirc;ng việc, thực hiện đầy đủ&nbsp; những nội dung cam kết trong hợp đồng;</li>
<li style="font-family:Times New Roman;">Chấp h&agrave;nh nghi&ecirc;m chỉnh nội quy lao động, AT &ndash; VSLĐ v&agrave; &nbsp;kỷ luật lao động của c&ocirc;ng ty.</li>
<li style="font-family:Times New Roman;">Trong thời gian hiệu lực hợp đồng v&agrave; trong v&ograve;ng 24 th&aacute;ng kể từ khi nghỉ việc tại C&ocirc;ng ty nh&acirc;n vi&ecirc;n kh&ocirc;ng được ph&eacute;p cung cấp th&ocirc;ng tin, tiết lộ b&iacute; mật kinh doanh của c&ocirc;ng ty. Trường hợp bị ph&aacute;t hiện, sẽ bị khởi tố trước ph&aacute;p luật.</li>
</ul>
<p style="font-family:Times New Roman;"><strong><u>Điều 4</u></strong><strong>:&nbsp;Nghĩa vụ v&agrave; quyền hạn của người sử dụng lao động:</strong></p>
<ol>
<li style="font-family:Times New Roman;">Nghĩa vụ:</li>
</ol>
<ul>
<li style="font-family:Times New Roman;">Bảo đảm việc l&agrave;m v&agrave; thực hiện đầy đủ những điều khoản trong hợp đồng;</li>
<li style="font-family:Times New Roman;">Thanh to&aacute;n đầy đủ, đ&uacute;ng thời hạn c&aacute;c chế độ v&agrave; quyền lợi cho người lao động theo hợp đồng n&agrave;y.</li>
</ul>
<ol start="2">
<li style="font-family:Times New Roman;">Quyền hạn:</li>
</ol>
<ul>
<li style="font-family:Times New Roman;">Điều h&agrave;nh người lao động ho&agrave;n th&agrave;nh c&ocirc;ng việc theo Hợp đồng (bố tr&iacute;, điều chuyển, tạm ngừng việc);</li>
<li style="font-family:Times New Roman;">Tạm ho&atilde;n, chấm dứt hợp đồng thử việc, kỷ luật người lao động theo quy định của ph&aacute;p luật, v&agrave; nội quy lao động của C&ocirc;ng ty.</li>
</ul>
<p style="font-family:Times New Roman;"><strong><u>Điều 5</u></strong><strong>: Cam kết chung:</strong></p>
<ul>
<li style="font-family:Times New Roman;">Sau khi kết th&uacute;c thời gian thử việc, người lao động được đ&aacute;nh gia nhận x&eacute;t nếu đủ năng lực v&agrave; y&ecirc;u cầu của c&ocirc;ng việc sẽ được k&yacute; hợp đồng d&agrave;i hạn v&agrave; được tham gia c&aacute;c chế độ ch&iacute;nh s&aacute;ch kh&aacute;c theo quy định.</li>
<li style="font-family:Times New Roman;">Người lao động trước khi v&agrave;o thử việc được đ&agrave;o tạo, được đọc, được th&ocirc;ng qua v&agrave; hiểu rất r&otilde; về bộ luật lao động, An to&agrave;n vệ sinh lao động, nội quy, quy định v&agrave; c&aacute;c chế độ ch&iacute;nh s&aacute;ch của c&ocirc;ng ty tại thời điểm k&yacute; hợp đồng.</li>
<li style="font-family:Times New Roman;">Người lao động đ&atilde; được nhận lại 01 bản hợp đồng thử việc sau khi k&yacute; kết hợp đồng.</li>
</ul>
<br>
<p style="font-family:Times New Roman;"><strong><u>Điều</u></strong><strong>&nbsp;6: Điều khoản thi h&agrave;nh:</strong></p>
<ul>
<li style="font-family:Times New Roman;">Những vấn đề về lao động kh&ocirc;ng ghi trong hợp đồng&nbsp;thử việc&nbsp;n&agrave;y th&igrave; &aacute;p dụng theo quy định của nội quy lao động v&agrave; ph&aacute;p luật lao động;</li>
<li style="font-family:Times New Roman;">Hợp đồng thử việc n&agrave;y l&agrave;m tại: Chi nh&aacute;nh C&ocirc;ng ty cổ phần Nam Tiệp tại Ninh B&igrave;nh, được lập th&agrave;nh 02 bản c&oacute; gi&aacute; trị như nhau, mỗi b&ecirc;n giữ 01 bản v&agrave; c&oacute; hiệu lực kể từ ng&agrave;y 01 th&aacute;ng 04 năm 2022</li>
</ul>
<table style="border-collapse: collapse; border: none; width: 100%; margin: 0px auto;">
    <tbody>
        <tr>
            <td style="width: 233.75pt;padding: 0in 5.4pt;vertical-align: top;">
                <p style='margin-top:0in;margin-right:0in;font-family:Times New Roman;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>&nbsp;</span></strong></p>
                <p style='margin-top:0in;margin-right:0in;font-family:Times New Roman;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>ĐẠI DIỆN B&Ecirc;N A</span></strong></p>
            </td>
            <td style="width: 233.75pt;padding: 0in 5.4pt;vertical-align: top;">
                <p style='margin-top:0in;margin-right:0in;font-family:Times New Roman;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>&nbsp;</span></strong></p>
                <p style='margin-top:0in;margin-right:0in;font-family:Times New Roman;margin-bottom:0in;margin-left:0in;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;line-height:normal;'><strong><span style='font-size:17px;font-family:"Times New Roman",serif;'>ĐẠI DIỆN B&Ecirc;N B</span></strong></p>
            </td>
        </tr>
    </tbody>
</table>
<p><strong>&nbsp;</strong></p>
<p>&nbsp;</p>`;

const ContentHtml = ({
  data,
}: {
  data: {
    companyName: string;
    companyNameShort: string;
    companyLocation: string;
    companyMST: string;
    companyPhoneNumber: string;
    companyOwner: string;
    companyOwnerNationality: string;
    companyOwnerPosition: string;
    companyOwnerDOB: string;
    employeeFullName: string;
    employeeNationality: string;
    employeeDOB: string;
    employeeBirthLocation: string;
    employeeLocation: string;
    employeeIdentityNumber: string;
    employeeIdentityIssueDate: string;
    employeeIdentityCity: string;
    employeePosition: string;
    employeePositionDesc: string[];
    employeeSalary: string;
    StartDate: string;
    EndDate: string;
    TimeTrial: string;
  };
}) => {
  const htmlString = getContentHtml(data);
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
};

export default ContentHtml;
